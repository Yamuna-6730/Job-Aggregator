import os
from typing import List
from dotenv import load_dotenv
from tavily import TavilyClient
from config import AppState, log

# ----------------------------
# ENV + CLIENTS
# ----------------------------
load_dotenv()

tavily_client = TavilyClient(api_key="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")

# ----------------------------
# Indeed search helper
# ----------------------------
def search_indeed_urls(keywords: str, location: str, limit: int = 1) -> List[str]:
    query = f'site:in.indeed.com/viewjob "{keywords}" "{location}"'
    
    # log("INDEED SEARCHING", query) # Optional logging

    res = tavily_client.search(
        query=query,
        search_depth="advanced",
        max_results=limit,
        include_answer=False,
        include_raw_content=False,
    )

    urls = []
    for r in res.get("results", []):
        url = r.get("url", "")
        # Filter for indeed viewjob links to ensure quality
        # Relaxed filter to catch more indeed variants
        if "indeed.com" in url:
            urls.append(url)

    # dedup
    urls = list(dict.fromkeys(urls))
    log("INDEED URLS FOUND", urls)
    return urls


# ----------------------------
# NODE: fetch indeed job urls and store in job_urls
# ----------------------------
async def indeed_urls_node(state: AppState) -> AppState:
    # Use extracted state, with fallbacks
    kw_list = state.get("keywords", [])
    loc_list = state.get("location", [])
    
    keywords = " ".join(kw_list) if kw_list else "internship"
    location = " ".join(loc_list) if loc_list else "India"
    limit = state.get("limit", 2)

    log("INDEED NODE START", {"keywords": keywords, "location": location, "limit": limit})

    # Fetch half of total limit (floor) for Indeed's share
    target = limit // 2
    urls = search_indeed_urls(keywords, location, target)

    return {
        **state,
        "job_urls": urls
    }
