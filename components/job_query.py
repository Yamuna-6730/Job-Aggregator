import os
import sys
from typing import List
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from config import AppState, log

# Load env if not loaded
load_dotenv()


llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY_1"),
    temperature=0.0
)

# ----------------------------
# Pydantic Schema
# ----------------------------
class JobQuery(BaseModel):
    keywords: List[str] = Field(default_factory=list)
    location: List[str] = Field(default_factory=list)
    limit: int = 4


# ----------------------------
# NODE: parse keywords/location from user_input
# ----------------------------
async def parse_job_query_node(state: AppState) -> AppState:
    user_input = state["user_input"]
    log("JOB QUERY PARSING", user_input)

    parser_llm = llm.with_structured_output(JobQuery)

    parsed: JobQuery = await parser_llm.ainvoke(
        f"""
Extract job search query from the message.

Return:
- keywords as list
- location as list
- limit as integer (default to 5 if not specified)

Message:
{user_input}
"""
    )
    
    log("JOB QUERY PARSED", parsed.dict())

    return {
        **state,
        "keywords": parsed.keywords,
        "location": parsed.location,
        "limit": parsed.limit,
    }
