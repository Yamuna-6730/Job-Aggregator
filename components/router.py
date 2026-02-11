import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from config import AppState, log
from typing import Literal
from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI

# Load environment variables
load_dotenv()

# -----------------------
# Pydantic Schema
# -----------------------
class RouteDecision(BaseModel):
    mode: Literal["job", "normal"]

# Gemini LLM
router_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.2,
    google_api_key=os.getenv("GOOGLE_API_KEY_3")
).with_structured_output(RouteDecision)

# -----------------------
# LangGraph Router Node
# -----------------------
async def route_node(state: AppState) -> AppState:
    user_input = state["user_input"]

    decision: RouteDecision = await router_llm.ainvoke(
        f"""
Classify the user message into ONE mode:
- job: job/internship/hiring/openings/resume/job search intent
- normal: everything else

Return only the mode.

User message:
{user_input}
"""
    )

    return {**state, "mode": decision.mode}



