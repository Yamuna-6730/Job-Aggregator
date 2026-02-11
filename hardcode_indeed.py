import os
import asyncio
from typing import List
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from tavily import TavilyClient
from langchain_google_genai import ChatGoogleGenerativeAI


# ============================
# ENV + CLIENTS
# ============================
load_dotenv()

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not TAVILY_API_KEY:
    raise ValueError("❌ TAVILY_API_KEY not found in .env")
if not GOOGLE_API_KEY:
    raise ValueError("❌ GOOGLE_API_KEY not found in .env")

tavily_client = TavilyClient(api_key=TAVILY_API_KEY)

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY_5"),
    temperature=0.0,
)


# ============================
# PYDANTIC QUERY MODEL
# ============================
class JobQuery(BaseModel):
    keywords: List[str] = Field(default_factory=list)
    location: List[str] = Field(default_factory=list)
    limit: int = 5


# ============================
# INDEED URL SEARCH FUNCTION
# ============================
def search_indeed_urls(keywords: str, location: str, limit: int = 5) -> List[str]:
    query = f'site:in.indeed.com/viewjob "{keywords}" "{location}"'
    print("\n🔎 Tavily Search Query:", query)

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
        if "indeed.com/viewjob" in url:
            urls.append(url)

    # ✅ remove duplicates
    return list(dict.fromkeys(urls))


# ============================
# NODE 1: Parse job query from user_input
# ============================
async def parse_job_query_node(state: dict) -> dict:
    user_input = state["user_input"]

    parser_llm = llm.with_structured_output(JobQuery)

    parsed: JobQuery = await parser_llm.ainvoke(
        f"""
Extract job search query from the message.

Return:
- keywords as list
- location as list
- limit as integer

Message:
{user_input}
"""
    )

    return {
        **state,
        "keywords": parsed.keywords,
        "location": parsed.location,
        "limit": parsed.limit,
    }


# ============================
# NODE 2: Fetch Indeed URLs and store in job_urls
# ============================
async def indeed_urls_node(state: dict) -> dict:
    keywords = " ".join(state.get("keywords", [])) or "internship"
    location = " ".join(state.get("location", [])) or "India"
    limit = state.get("limit", 5)

    urls = search_indeed_urls(keywords, location, limit)

    return {
        **state,
        "job_urls": urls
    }


# ============================
# HARD-CODED TEST RUN
# ============================
async def broooooo():
    state = {
        "user_input": "Find me data science internships in Hyderabad, give 5 job links"
    }

    # Step 1: parse query
    state = await parse_job_query_node(state)
    print("\n✅ After parse_job_query_node()")
    print("keywords:", state.get("keywords"))
    print("location:", state.get("location"))
    print("limit:", state.get("limit"))

    # Step 2: fetch Indeed URLs
    state = await indeed_urls_node(state)
    print("\n✅ After indeed_urls_node()")
    return {**state,"job_urls": state.get("job_urls", [])}
    print("job_urls:")
    for u in state.get("job_urls", []):
        print("-", u)
