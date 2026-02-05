import os
import json
import asyncio
from typing import TypedDict, List, Literal, Any, Dict
from config import AppState, log
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

import components.mcp_compat

# Import Components
from components.router import route_node
from components.job_query import parse_job_query_node
from components.indeed import indeed_urls_node
from components.linkedin import mcp_agent_node
from components.scrap_structure import structured_data_node
from components.final_answer import final_answer_node

# =======================
# ENV
# =======================
load_dotenv()

# =======================
# LLM (for Normal Chat)
# =======================
# We can use the same generic LLM for normal chat or import a dedicated one.
# Reusing the setup from previous main.py for normal chat.
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.3)

async def normal_chat_node(state: AppState) -> AppState:
    log("NORMAL CHAT NODE", state["user_input"])
    resp = await llm.ainvoke([HumanMessage(content=state["user_input"])])
    return {**state, "final_answer": resp.content}

# =======================
# PARALLEL SEARCH NODE
# =======================
async def parallel_search_node(state: AppState) -> AppState:
    """
    Executes LinkedIn (MCP) and Indeed (Tavily) searches in parallel.
    Merges found job URLs.
    """
    log("PARALLEL SEARCH NODE START")
    
    # Run both tasks concurrently
    # Note: Both nodes take state and return {**state, "job_urls": ...}
    # We pass the same initial state to both.
    results = await asyncio.gather(
        mcp_agent_node(state),
        indeed_urls_node(state),
        return_exceptions=True
    )
    
    linkedin_res, indeed_res = results
    
    l_urls = []
    i_urls = []
    
    # Process LinkedIn Results
    if isinstance(linkedin_res, dict):
        l_urls = linkedin_res.get("job_urls", [])
    else:
        log("LINKEDIN SEARCH FAILED", str(linkedin_res))
        
    # Process Indeed Results
    if isinstance(indeed_res, dict):
        i_urls = indeed_res.get("job_urls", [])
    else:
        log("INDEED SEARCH FAILED", str(indeed_res))
        
    # Interleave URLs: [L1, I1, L2, I2, ...]
    final_urls = []
    max_len = max(len(l_urls), len(i_urls))
    
    for k in range(max_len):
        if k < len(l_urls):
            final_urls.append(l_urls[k])
        if k < len(i_urls):
            final_urls.append(i_urls[k])

    # Dedup preserving order
    unique_urls = list(dict.fromkeys(final_urls))
    log("MERGED JOB URLS (Interleaved)", unique_urls)
    
    return {**state, "job_urls": unique_urls}

# =======================
# GRAPH
# =======================
def route_condition(state: AppState) -> Literal["normal_chat", "job_flow"]:
    # Route based on the mode determined by the router node
    mode = state.get("mode", "normal")
    log("ROUTE CONDITION", mode)
    return "job_flow" if mode == "job" else "normal_chat"


def build_graph():
    g = StateGraph(AppState)

    # Nodes
    g.add_node("route", route_node)
    g.add_node("normal_chat", normal_chat_node)
    
    g.add_node("job_query", parse_job_query_node)
    g.add_node("parallel_search", parallel_search_node)
    g.add_node("structure", structured_data_node)
    g.add_node("recommendation", final_answer_node)

    # Entry
    g.set_entry_point("route")

    # Conditional logic
    g.add_conditional_edges(
        "route",
        route_condition,
        {
            "normal_chat": "normal_chat",
            "job_flow": "job_query"
        },
    )

    # Job Flow Edges
    g.add_edge("job_query", "parallel_search")
    g.add_edge("parallel_search", "structure")
    g.add_edge("structure", "recommendation")
    g.add_edge("recommendation", END)

    # Normal Flow Edges
    g.add_edge("normal_chat", END)

    return g.compile()


# =======================
# RUN
# =======================
async def run_once(user_input: str):
    app = build_graph()

    state: AppState = {
        "user_input": user_input,
        "mode": "normal", # default
        "job_urls": [],
        "jobs": [],
        "keywords": [],
        "location": [],
        "structured_data": {},
        "final_answer": "",
    }
    
    print(f"🚀 STARTING WOFKLOW WITH INPUT: {user_input}")

    result = await app.ainvoke(state)

    print("\n✅ FINAL OUTPUT:\n")
    print(result.get("final_answer", "No answer generated."))


if __name__ == "__main__":
    # Test query
    asyncio.run(run_once("i am looking for machine learning engineer jobs in Telangana from LinkedIn, i am very interested in using tools which are used for testing"))

