####not usingnnnnnnnn


import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import re
from typing import Dict, Any
from typing import List, Dict, Any, Optional, Literal
from datetime import datetime, timezone
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field

llm= ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.2,
    api_key="AIzaSyDiqWSHL3dHzil4z__UOP9t9GCm7zG3vSQ"
)


def clean_text(s: str) -> str:
    s = re.sub(r"\s+", " ", s).strip()
    return s
# ============================
# PYDANTIC SCHEMA
# ============================
class JobItem(BaseModel):
    job_title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None

    work_mode: Literal["Remote", "Hybrid", "Onsite", "Unknown"] = "Unknown"
    experience_required: Optional[str] = None

    skills_required: List[str] = Field(default_factory=list)
    education: Optional[str] = None
    salary_or_stipend: Optional[str] = None
    eligibility: Optional[str] = None

    responsibilities: List[str] = Field(default_factory=list)
    requirements: List[str] = Field(default_factory=list)

    summary: Optional[str] = None
    source_url: Optional[str] = None


class RecommendedBestJob(BaseModel):
    source_url: Optional[str] = None
    reason: Optional[str] = None


class JobLLMOutput(BaseModel):
    jobs: List[JobItem] = Field(default_factory=list)
    recommended_best_job: RecommendedBestJob


# ============================
# STRUCTURING FUNCTION
# ============================
def structure_all_jobs_with_llm(
    user_prompt: str,
    jobs_data: List[Dict[str, Any]],
    clean_text,
    max_chars_per_job: int = 2500
) -> Dict[str, Any]:
    """
    ✅ Single LLM call
    ✅ Pydantic structured output
    ✅ Returns dict with jobs + recommended_best_job + fetched_at
    """

    jobs_text = []

    for i, item in enumerate(jobs_data, start=1):
        url = item.get("url")
        content = clean_text(item.get("content", ""))[:max_chars_per_job]

        jobs_text.append(
            f"""
JOB {i}
URL: {url}
CONTENT:
{content}
"""
        )

    prompt = f"""
You are a job extraction + recommendation assistant.

USER REQUEST:
{user_prompt}

Below are multiple job page contents:

{''.join(jobs_text)}

TASK:
Extract all important fields from each job and recommend the best job for the user's request.
"""

    # ✅ Enforce structured output
    structured_llm = llm.with_structured_output(JobLLMOutput)

    parsed: JobLLMOutput = structured_llm.invoke(prompt)

    # ✅ Convert to normal dict
    output = parsed.model_dump()
    output["fetched_at"] = datetime.now(timezone.utc).isoformat()

    return output