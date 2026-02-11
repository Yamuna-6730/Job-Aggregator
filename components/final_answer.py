import os
import json
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI

from config import AppState 


# ============================
# ENV + LLM
# ============================
load_dotenv()

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key="AIzaSyCXwA6FkjXhDOdEL1y8yenwe-CtPxLyFM0",
    temperature=0.3,
)


# ============================
# LANGGRAPH NODE
# ============================
async def final_answer_node(state: AppState) -> AppState:
    """
    ✅ Reads:
      - state["user_input"]
      - state["structured_data"]

    ✅ Writes:
      - state["final_answer"]
    """

    user_input = state.get("user_input", "")
    structured_data = state.get("structured_data", {})

    jobs = structured_data.get("jobs", [])

    # if no jobs found
    if not jobs:
        return {
            **state,
            "final_answer": "❌ I couldn't find any jobs for your query. Try changing keywords/location."
        }

    prompt = f"""
You are an Agentic Job Assistant.

USER REQUEST:
{user_input}

Here are the extracted structured jobs (JSON):
{json.dumps(jobs, indent=2)}

TASK:
1) Give a quick list of jobs (Title | Company | Location | Apply URL)
2) Give short summary for each job (2-3 lines)
3) Recommend the best job for the user request + why
4) Suggest next steps: what to prepare / how to apply / resume tips

Make the answer professional and easy to read.
"""

    response = (await llm.ainvoke(prompt)).content

    return {
        **state,
        "final_answer": response
    }