from typing import List, Optional
from pydantic import BaseModel, Field

from firecrawl import Firecrawl
from dotenv import load_dotenv


from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import PromptTemplate

load_dotenv()
# -------------------- 1) Pydantic Schema --------------------

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
    jobs: List[Job]


# -------------------- 2) Firecrawl Setup --------------------

FIRECRAWL_API_KEY = "fc-66f8af9cd9b349848648d3abb89e8f57"
firecrawl = Firecrawl(api_key=FIRECRAWL_API_KEY)

def scrape_job_page(url: str) -> str:
    doc = firecrawl.scrape(
        url,
        wait_for=3000,
        formats=["markdown"]
    )
    return doc.markdown or ""


def clean_markdown(md: str, limit: int = 9000) -> str:
    md = md.strip()
    return md[:limit]


# -------------------- 3) LLM + Pydantic Parser Setup --------------------

parser = PydanticOutputParser(pydantic_object=JobList)

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash"
)


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
    partial_variables={"format_instructions": parser.get_format_instructions()}
)

def extract_structured_job(markdown: str, url: str) -> JobList:
    """
    Strict extraction using PydanticOutputParser
    """
    chain = prompt | llm | parser
    return chain.invoke({"markdown": markdown, "url": url})


# -------------------- 4) Multiple URL Support --------------------

def scrape_and_extract_jobs(urls: List[str]) -> JobList:
    """
    Returns: JobList(jobs=[...]) for 1 or many URLs
    """
    all_jobs = []

    for url in urls:
        md = scrape_job_page(url)
        md = clean_markdown(md)

        structured = extract_structured_job(md, url)
        all_jobs.extend(structured.jobs)

    return JobList(jobs=all_jobs)


# -------------------- 5) Run Example --------------------

if __name__ == "__main__":
    urls = [
        "https://in.indeed.com/viewjob?jk=580826eeea8e5ebd",
        # "https://in.indeed.com/viewjob?jk=ANOTHER_JOB_ID"
    ]

    result = scrape_and_extract_jobs(urls)

    print(result.model_dump_json(indent=2))