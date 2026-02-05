import os
from typing import List, Dict, Any, Optional
import time

from dotenv import load_dotenv
from firecrawl import Firecrawl
from tavily import TavilyClient

from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import PromptTemplate
from config import AppState, log


# ============================
# ENV + CLIENTS
# ============================
load_dotenv()




firecrawl = Firecrawl(api_key="fc-66f8af9cd9b349848648d3abb89e8f57")
tavily_client = TavilyClient(api_key="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")

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key="AIzaSyCUYzXzYMfP2AVwtRteFkKucXyZpenP33c",
    temperature=0.2,
)


# ============================
# PYDANTIC SCHEMA
# ============================
class Job(BaseModel):
    job_title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    work_mode: str = "Unknown"  # Remote / Hybrid / Onsite / Unknown
    experience_required: Optional[str] = None

    skills_required: List[str] = Field(default_factory=list)
    education: Optional[str] = None
    salary_or_stipend: Optional[str] = None
    eligibility: Optional[str] = None

    responsibilities: List[str] = Field(default_factory=list)
    requirements: List[str] = Field(default_factory=list)

    job_description: Optional[str] = None
    summary: Optional[str] = None
    source_url: Optional[str] = None


class JobList(BaseModel):
    jobs: List[Job] = Field(default_factory=list)


# ============================
# INTERNAL HELPER
# ============================
def _clean_markdown(md: str, limit: int = 9000) -> str:
    return (md or "").strip()[:limit]

def _is_expired(markdown: str) -> bool:
    """
    Checks for common keywords indicating a job is expired.
    """
    if not markdown:
        return True
    
    md_lower = markdown.lower()
    expired_phrases = [
        "this job has expired",
        "job has expired",
        "no longer accepting applications",
        "job not found",
        "position closed",
        "this job is no longer available",
        "applications are closed",
    ]
    
    for phrase in expired_phrases:
        if phrase in md_lower:
            return True
    return False


# ============================
# LANGGRAPH NODE (MAIN)
# ============================
async def structured_data_node(state: AppState) -> AppState:
    """
    ✅ Reads:  state["job_urls"]
    ✅ Writes: state["structured_data"]
    ✅ Returns: updated AppState
    """

    urls = state.get('job_urls', [])
    limit = state.get('limit', 5) # Default limit if not set
    log("STRUCTURE NODE START", {"url_count": len(urls), "target_limit": limit})

    if not urls:
        return {**state, "structured_data": {"jobs": []}}

    parser = PydanticOutputParser(pydantic_object=JobList)

    prompt = PromptTemplate(
        template="""
You are an information extraction system.

Extract job information from the given scraped markdown.

Rules:
- Output MUST be valid JSON only
- Output MUST match the schema exactly
- If a value is missing: use null (or [] for lists)
- work_mode must be one of: Remote, Hybrid, Onsite, Unknown
- source_url must be the original url provided

Schema:
{format_instructions}

SOURCE URL: {url}

SCRAPED MARKDOWN:
{markdown}
""",
        input_variables=["markdown", "url"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )

    chain = prompt | llm | parser

    all_jobs: List[Job] = []

    for url in urls:
        # Stop if we reached the limit
        if len(all_jobs) >= limit:
            log("LIMIT REACHED", len(all_jobs))
            break

        try:
            markdown = ""
            
            if "linkedin.com" in url:
                # Use Tavily for LinkedIn
                # extract returns: {'results': [{'url': '...', 'raw_content': '...', 'content': '...'}], ...}
                response = tavily_client.extract(urls=[url],extract_depth="advanced")
                if response and "results" in response and len(response["results"]) > 0:
                    # Prefer raw_content if available, else content
                    res = response["results"][0]
                    markdown = res.get("raw_content") or res.get("content", "")
                else:
                    log("TAVILY EXTRACT FAILED", url)
                    continue
            else:
                # Use Firecrawl for others (Indeed, etc.)
                try:
                    doc = firecrawl.scrape(
                        url,
                        wait_for=10000,
                        formats=["markdown"],
                    )
                    time.sleep(3)
                    markdown = getattr(doc, "markdown", "") or ""
                except Exception as fc_err:
                     log("FIRECRAWL EXTRACT FAILED", str(fc_err))
                     continue

            # Check expiration
            if _is_expired(markdown):
                log("JOB EXPIRED - SKIPPING", url)
                continue

            markdown = _clean_markdown(markdown)

            structured: JobList = chain.invoke({"markdown": markdown, "url": url})
            
            # Add valid jobs and ensure source_url present
            if structured.jobs:
                for job in structured.jobs:
                    # Stop adding if we already reached the limit
                    if len(all_jobs) >= limit:
                        break
                        
                    try:
                        # Ensure we have a Job instance (parser may return Job objects or dicts)
                        if isinstance(job, Job):
                            validated_job = job
                        else:
                            validated_job = Job.model_validate(job)

                        # Ensure source_url is set to the original URL
                        if not validated_job.source_url:
                            validated_job.source_url = url

                        all_jobs.append(validated_job)
                        log("JOB ADDED", f"{len(all_jobs)}/{limit}")
                    except Exception:
                        # Skip malformed extractions
                        continue

        except Exception as e:
            log("STRUCTURE ERROR", str(e))
            # Don't add failed extractions or maybe add with error note?
            # User wants valid jobs, so better to skip failed/malformed ones.
            pass

    # Final info log
    log("SCRAPING COMPLETE", f"Got {len(all_jobs)} valid jobs out of {limit} requested from {len(urls)} URLs")

    # Convert all Job objects to plain dicts for storage
    structured_data_dict = JobList(jobs=[j.model_dump() for j in all_jobs]).model_dump()

    return {
        **state,
        "structured_data": structured_data_dict
    }
