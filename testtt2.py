import os
import json
import re
import time
from typing import List, Dict, Any
from datetime import datetime

from dotenv import load_dotenv
from tavily import TavilyClient
from firecrawl import Firecrawl
from langchain_google_genai import ChatGoogleGenerativeAI


# ----------------------------
# ENV SETUP
# ----------------------------
load_dotenv()

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not TAVILY_API_KEY:
    raise ValueError("❌ TAVILY_API_KEY missing in .env")
if not FIRECRAWL_API_KEY:
    raise ValueError("❌ FIRECRAWL_API_KEY missing in .env")
if not GOOGLE_API_KEY:
    raise ValueError("❌ GOOGLE_API_KEY missing in .env")

tavily_client = TavilyClient(api_key=TAVILY_API_KEY)
firecrawl = Firecrawl(api_key=FIRECRAWL_API_KEY)

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=GOOGLE_API_KEY,
)


# ----------------------------
# HELPERS
# ----------------------------
def dedup_urls(urls: List[str]) -> List[str]:
    return list(dict.fromkeys(urls))


def clean_text(text: str) -> str:
    if not text:
        return ""
    return re.sub(r"\s+", " ", text).strip()


def safe_json_from_llm(text: str) -> Dict[str, Any]:
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return {"error": "No JSON found in LLM output", "raw_output": text}

    try:
        return json.loads(match.group())
    except Exception as e:
        return {"error": f"JSON parse failed: {str(e)}", "raw_output": text}


# ----------------------------
# 1) SEARCH INDEED LINKS (Tavily)
# ----------------------------
def search_indeed_urls(keywords: str, location: str, limit: int = 3) -> List[str]:
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

    return dedup_urls(urls)


# ----------------------------
# 2) SCRAPE USING FIRECRAWL SDK
# ----------------------------
def scrape_all_with_firecrawl(urls: List[str], sleep_sec: float = 1.5) -> List[Dict[str, Any]]:
    results = []

    for i, url in enumerate(urls, start=1):
        print(f"\n🔥 Firecrawl scraping ({i}/{len(urls)}): {url}")

        try:
            doc = firecrawl.scrape(
                url,
                formats=["markdown", "html"],  # markdown is enough, html optional
                # Firecrawl SDK might not support waitFor in all versions.
                # If your version supports it, you can add:
                # waitFor=5000
            )

            results.append({
                "url": url,
                "success": True,
                "data": doc.get("data", doc)  # depends on SDK return structure
            })
            print("✅ Scrape successful.",doc)
        except Exception as e:
            results.append({
                "url": url,
                "success": False,
                "error": str(e)
            })

        # ✅ reduce requests/min
        time.sleep(sleep_sec)

    return results


# ----------------------------
# 3) ONE LLM CALL FOR STRUCTURING + RECOMMENDATION
# ----------------------------
def structure_jobs_with_llm(user_prompt: str, scraped_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    job_blocks = []

    for idx, item in enumerate(scraped_results, start=1):
        url = item.get("url")

        if not item.get("success"):
            job_blocks.append(
                f"""
JOB {idx}
URL: {url}
CONTENT: (SCRAPE FAILED)
ERROR: {item.get("error")}
"""
            )
            continue

        markdown = item.get("data", {}).get("markdown", "")
        markdown = clean_text(markdown)[:3500]  # cap per job

        job_blocks.append(
            f"""
JOB {idx}
URL: {url}
CONTENT (MARKDOWN):
{markdown}
"""
        )

    prompt = f"""
You are an Agentic Job Assistant.

USER REQUEST:
{user_prompt}

Below are multiple Indeed job pages scraped using Firecrawl.

{''.join(job_blocks)}

TASK:
Return JSON only (no markdown, no explanation).

Output format:
{{
  "jobs": [
    {{
      "job_title": null,
      "company": null,
      "location": null,
      "work_mode": "Remote/Hybrid/Onsite/Unknown",
      "experience_required": null,
      "skills_required": [],
      "education": null,
      "salary_or_stipend": null,
      "eligibility": null,
      "responsibilities": [],
      "requirements": [],
      "summary": null,
      "source_url": null
    }}
  ],
  "recommended_best_job": {{
    "source_url": null,
    "reason": null
  }}
}}
"""

    llm_out = llm.invoke(prompt).content
    parsed = safe_json_from_llm(llm_out)
    parsed["fetched_at"] = datetime.utcnow().isoformat()
    return parsed


# ----------------------------
# RUN PIPELINE
# ----------------------------
def run_pipeline(user_prompt: str, keywords: str, location: str, limit: int = 3):
    print("\n==============================")
    print("✅ INDEED + FIRECRAWL SDK TEST")
    print("==============================")

    urls = search_indeed_urls(keywords, location, limit)

    if not urls:
        print("\n❌ No Indeed URLs found.")
        return

    print("\n✅ URLs found:")
    for u in urls:
        print("-", u)

    scraped = scrape_all_with_firecrawl(urls, sleep_sec=2.0)

    structured = structure_jobs_with_llm(user_prompt, scraped)

    print("\n==============================")
    print("✅ STRUCTURED OUTPUT (JSON)")
    print("==============================\n")
    print(json.dumps(structured, indent=2))


if __name__ == "__main__":
    user_prompt = "Find me Data Science internships in Hyderabad and recommend the best one."
    keywords = "data science internship"
    location = "Hyderabad"
    limit = 3

    run_pipeline(user_prompt, keywords, location, limit)