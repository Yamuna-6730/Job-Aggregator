import os
import json
import re
from typing import List, Dict, Any
from datetime import datetime
from components.structure_data import structure_all_jobs_with_llm
from dotenv import load_dotenv
from tavily import TavilyClient
from langchain_google_genai import ChatGoogleGenerativeAI

# ----------------------------
# ENV SETUP
# ----------------------------
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
# INDEED SEARCH + RAW CONTENT
# ----------------------------
def search_indeed_with_raw_content(keywords: str, location: str, limit: int = 3) -> List[Dict[str, Any]]:
    query = f'site:in.indeed.com/viewjob "{keywords}" "{location}"'
    print("\n🔎 Tavily Search Query:", query)

    res = tavily_client.search(
        query=query,
        search_depth="advanced",
        max_results=limit,
        include_answer=False,
        include_raw_content=True,   # ✅ IMPORTANT
    )

    results = res.get("results", [])
    cleaned = []

    for r in results:
        url = r.get("url", "")
        raw = r.get("raw_content", "")  # ✅ comes from search itself
        if "indeed.com/viewjob" in url:
            cleaned.append({
                "url": url,
                "content": raw
            })

    # Dedup by URL
    seen = set()
    final = []
    for item in cleaned:
        if item["url"] not in seen:
            seen.add(item["url"])
            final.append(item)

    return final

# ----------------------------
# SINGLE LLM CALL FOR ALL JOBS
# ----------------------------
# def structure_all_jobs_with_llm(user_prompt: str, jobs_data: List[Dict[str, Any]]) -> Dict[str, Any]:
#     jobs_text = []

#     for i, item in enumerate(jobs_data, start=1):
#         url = item["url"]
#         content = clean_text(item.get("content", ""))[:2500]  # cap per job

#         jobs_text.append(
#             f"""
# JOB {i}
# URL: {url}
# CONTENT:
# {content}
# """
#         )

#     prompt = f"""
# You are a job extraction + recommendation assistant.

# USER REQUEST:
# {user_prompt}

# Below are multiple Indeed job page contents:

# {''.join(jobs_text)}

# TASK:
# Return JSON only (no markdown, no explanation).
# Extract all important fields.

# Output format:
# {{
#   "jobs": [
#     {{
#       "job_title": null,
#       "company": null,
#       "location": null,
#       "work_mode": "Remote/Hybrid/Onsite/Unknown",
#       "experience_required": null,
#       "skills_required": [],
#       "education": null,
#       "salary_or_stipend": null,
#       "eligibility": null,
#       "responsibilities": [],
#       "requirements": [],
#       "summary": null,
#       "source_url": null
#     }}
#   ],
#   "recommended_best_job": {{
#     "source_url": null,
#     "reason": null
#   }}
# }}
# """

#     llm_output = llm.invoke(prompt).content
#     parsed = safe_json_from_llm(llm_output)
#     parsed["fetched_at"] = datetime.utcnow().isoformat()
#     return parsed

# ----------------------------
# RUN PIPELINE
# ----------------------------
def run_pipeline(user_prompt: str, keywords: str, location: str, limit: int = 3):
    print("\n==============================")
    print("✅ INDEED RAW SEARCH TEST STARTED")
    print("==============================")

    jobs_data = search_indeed_with_raw_content(keywords, location, limit)

    if not jobs_data:
        print("\n❌ No jobs found or raw content blocked.")
        return

    print("\n✅ Found jobs:")
    for j in jobs_data:
        print("-", j["url"], "| content_len:", len(j.get("content", "")))

    # structured = structure_all_jobs_with_llm(user_prompt, jobs_data, clean_text)

    # print("\n==============================")
    # print("✅ STRUCTURED OUTPUT (JSON)")
    # print("==============================\n")
    # print(json.dumps(structured, indent=2))

if __name__ == "__main__":
    user_prompt = "Find me Data Science internships in Hyderabad and recommend the best one."
    keywords = "data science internship"
    location = "Hyderabad"
    limit = 3

    run_pipeline(user_prompt, keywords, location, limit)