import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from typing import TypedDict, List, Literal, Any, Dict
from langchain_core.messages import HumanMessage, SystemMessage,BaseMessage
from langchain_mcp_adapters.client import MultiServerMCPClient
from components.mcp_server import get_mcp_cache, SERVERS
from config import AppState, log
from langchain_core.messages import ToolMessage, AIMessage, BaseMessage
import json
import traceback

from langchain_google_genai import ChatGoogleGenerativeAI

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.2,
    google_api_key=os.getenv("GOOGLE_API_KEY_4")
)

def normalize_mcp_result(result: Any) -> Any:
    # Handles MCP "text blocks"
    if isinstance(result, list) and result and isinstance(result[0], dict) and "text" in result[0]:
        txt = result[0]["text"]
        try:
            return json.loads(txt)
        except Exception:
            return {"raw_text": txt}
    return result

async def load_mcp_tools_cached():
    cache = get_mcp_cache()
    
    if cache.tools is not None:
        return cache.tools, cache.tool_map

    log("Initializing MCP Client...")
    try:
        client = MultiServerMCPClient(SERVERS)
        tools = await client.get_tools()
        tool_map = {t.name: t for t in tools}

        cache.tools = tools
        cache.tool_map = tool_map

        log("MCP Tools loaded", list(tool_map.keys()))
        return tools, tool_map
    except Exception as e:
        log("MCP Client Init Failed", str(e))
        traceback.print_exc()
        raise e


async def mcp_agent_node(state: AppState) -> AppState:
    """
    Directly calls the MCP tool 'search_jobs' using keywords/location from AppState.
    """
    
    # Get args from state
    kw_list = state.get("keywords", [])
    loc_list = state.get("location", [])
    
    keywords = " ".join(kw_list) if kw_list else "Software Engineer"
    location = " ".join(loc_list) if loc_list else "India"
    limit = state.get("limit", 2)
    
    log("LINKEDIN NODE START", {"keywords": keywords, "location": location, "limit": limit})

    try:
        tools, tool_map = await load_mcp_tools_cached()
    except Exception as e:
        log("MCP TOOLS LOAD FAILED", str(e))
        # traceback.print_exc()
        return {**state, "job_urls": []}

    job_urls = []

    if "search_jobs" in tool_map:
        tool = tool_map["search_jobs"]
        # Fetch half of total limit (ceiling) for LinkedIn's share
        target = (limit + 1) // 2  # ceiling division
        tool_args = {"keywords": keywords, "location": location, "limit": target}
        
        log("MCP TOOL CALL: search_jobs", tool_args)
        
        try:
            # Invoke tool
            raw = await tool.ainvoke(tool_args)
            parsed = normalize_mcp_result(raw)
            log("MCP TOOL RESULT", parsed)
            
            # Extract URLs
            if isinstance(parsed, dict) and "job_urls" in parsed:
                job_urls.extend(parsed["job_urls"])
            elif isinstance(parsed, list): # fallback if result is a list
                 pass 
        except Exception as e:
            log("MCP TOOL INVOKE FAILED", str(e))

    else:
        log("MCP TOOL 'search_jobs' NOT FOUND", list(tool_map.keys()))

    # unique list
    seen = set()
    job_urls = [u for u in job_urls if not (u in seen or seen.add(u))]

    log("LINKEDIN URLS FOUND", job_urls)

    return {**state, "job_urls": job_urls}
