import os
import re
import json
import asyncio
from typing import TypedDict, List, Literal, Any, Dict
from components.router import route_node
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_mcp_adapters.client import MultiServerMCPClient
from tavily import TavilyClient
from langchain_core.messages import ToolMessage, AIMessage, BaseMessage

def log(title: str, data: Any = None):
    if not DEBUG:
        return
    print("\n" + "=" * 90)
    print(f"🟦 {title}")
    if data is not None:
        try:
            print(json.dumps(data, indent=2, ensure_ascii=False))
        except Exception:
            print(data)
    print("=" * 90)

# =======================
# ENV
# =======================
load_dotenv()

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
if not TAVILY_API_KEY:
    raise ValueError("❌ TAVILY_API_KEY missing in .env")

tavily = TavilyClient(api_key=TAVILY_API_KEY)

DEBUG = True


def log(title: str, data: Any = None):
    if not DEBUG:
        return
    print("\n" + "=" * 90)
    print(f"🟦 {title}")
    if data is not None:
        try:
            print(json.dumps(data, indent=2, ensure_ascii=False))
        except Exception:
            print(data)
    print("=" * 90)


# =======================
# MCP (HTTP)
# =======================
SERVERS = {
    "linkedin": {
        "transport": "streamable-http",
        "url": "http://127.0.0.1:8080/mcp",
    }
}

_MCP_CACHE = {"tools": None, "tool_map": None}


async def load_mcp_tools_cached():
    if _MCP_CACHE["tools"] is not None:
        return _MCP_CACHE["tools"], _MCP_CACHE["tool_map"]

    client = MultiServerMCPClient(SERVERS)
    tools = await client.get_tools()
    tool_map = {t.name: t for t in tools}

    _MCP_CACHE["tools"] = tools
    _MCP_CACHE["tool_map"] = tool_map

    log("MCP Tools loaded", list(tool_map.keys()))
    return tools, tool_map


def normalize_mcp_result(result: Any) -> Any:
    # Handles MCP "text blocks"
    if isinstance(result, list) and result and isinstance(result[0], dict) and "text" in result[0]:
        txt = result[0]["text"]
        try:
            return json.loads(txt)
        except Exception:
            return {"raw_text": txt}
    return result


# =======================
# PARSER (no LLM)
# =======================
import re
from typing import Dict, Any

def clean_text(s: str) -> str:
    s = re.sub(r"\s+", " ", s).strip()
    return s

def extract_section(text: str, start_keys: list[str], max_chars: int = 900) -> str | None:
    """
    Extract a chunk after a heading like 'About the Role' / 'Role Overview'
    """
    lowered = text.lower()
    for key in start_keys:
        idx = lowered.find(key.lower())
        if idx != -1:
            chunk = text[idx: idx + max_chars]
            return clean_text(chunk)
    return None

def parse_job_from_tavily(raw_content: str, fallback_title: str, url: str) -> Dict[str, Any]:
    text = raw_content or ""

    # title often in fallback_title like: "UBS hiring Software Engineer - Agentic AI ... | LinkedIn"
    job_title = fallback_title.split(" hiring ")[-1].split(" | LinkedIn")[0].strip()
    company = fallback_title.split(" hiring ")[0].strip()

    # location
    location = None
    m = re.search(r"([A-Za-z]+,\s*[A-Za-z]+,\s*India)", text)
    if m:
        location = m.group(1)

    # posted time
    posted = None
    m = re.search(r"(\d+\s+(?:day|days|week|weeks|month|months)\s+ago)", text)
    if m:
        posted = m.group(1)

    # stipend
    stipend = None
    m = re.search(r"Stipend:\s*([^\n]+)", text)
    if m:
        stipend = m.group(1).strip()

    # work mode
    work_mode = None
    m = re.search(r"Work mode:\s*([^\n]+)", text)
    if m:
        work_mode = m.group(1).strip()

    # ✅ description extract (best-effort)
    description = extract_section(
        text,
        start_keys=[
            "About the Role",
            "Role Overview",
            "What You’ll Work On",
            "Job Description",
            "Responsibilities",
            "What you will do",
        ],
        max_chars=1200
    )

    # fallback description (first meaningful chunk)
    if not description:
        cleaned = clean_text(text)
        description = cleaned[:700] if cleaned else None

    return {
        "job_title": job_title,
        "company": company,
        "location": location,
        "posted": posted,
        "stipend": stipend,
        "work_mode": work_mode,
        "description": description,   # ✅ NEW FIELD
        "url": url,
    }


# =======================
# STATE
# =======================
class AppState(TypedDict):
    mode: Literal["normal", "job"]
    user_input: str
    job_urls: List[str]
    jobs: List[dict]
    final_answer: str


# =======================
# LLM (only for final answer)
# =======================
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.3)


# =======================
# ROUTER (NO LLM)
# =======================
def decide_mode(user_input: str) -> Literal["job", "normal"]:
    msg = user_input.lower()
    if any(k in msg for k in ["job", "jobs", "intern", "internship", "linkedin", "hiring", "opening", "role"]):
        return "job"
    return "normal"


async def route_node(state: AppState) -> AppState:
    mode = decide_mode(state["user_input"])
    log("ROUTER MODE", {"mode": mode, "user_input": state["user_input"]})
    return {**state, "mode": mode}


# =======================
# NORMAL CHAT (1 LLM call)
# =======================
async def normal_chat_node(state: AppState) -> AppState:
    resp = await llm.ainvoke([HumanMessage(content=state["user_input"])])
    return {**state, "final_answer": resp.content}


# =======================
# JOB WORKFLOW (NO LLM until final)
# =======================
# async def mcp_search_node(state: AppState) -> AppState:
#     _, tool_map = await load_mcp_tools_cached()

#     if "search_jobs" not in tool_map:
#         raise RuntimeError("❌ MCP tool search_jobs not found")

#     user_input = state["user_input"]

#     # basic query extraction (no LLM)
#     keywords = "Agentic AI" if "agentic" in user_input.lower() else "AI"
#     location = "Hyderabad, Telangana, India" if "hyderabad" in user_input.lower() else "Telangana, India"

#     tool_args = {"keywords": keywords, "location": location, "limit": 5}

#     log("MCP CALL: search_jobs", tool_args)

#     raw = await tool_map["search_jobs"].ainvoke(tool_args)
#     parsed = normalize_mcp_result(raw)

#     log("MCP RESULT parsed", parsed)

#     urls = parsed.get("job_urls", []) if isinstance(parsed, dict) else []
#     return {**state, "job_urls": urls}
async def mcp_agent_node(state: AppState) -> AppState:
    """
    LLM extracts keywords/location/limit from the user's prompt
    and calls MCP tools (search_jobs, optionally get_job_details).
    """
    tools, tool_map = await load_mcp_tools_cached()
    llm_with_tools = llm.bind_tools(tools)

    system = SystemMessage(content="""
You are a LinkedIn job assistant.

Your task:
1) Understand the user's request and extract:
   - keywords (role/tech)
   - location (city/state/country)
   - limit (3 to 8)
2) Call the tool search_jobs with correct args.
   Example args:
   {"keywords": "...", "location": "...", "limit": 5}
3) If job_urls are returned, DO NOT hallucinate titles.
   We will fetch details later from web enrichment.
4) If authentication fails, clearly report it.
""")

    messages: List[BaseMessage] = [system, HumanMessage(content=state["user_input"])]

    # ✅ We keep max 2 tool-call steps to reduce LLM calls
    for step in range(2):
        resp = await llm_with_tools.ainvoke(messages)
        messages.append(resp)

        tool_calls = getattr(resp, "tool_calls", None) or []
        log(f"MCP_AGENT step {step+1} tool_calls", tool_calls)

        if not tool_calls:
            break

        for tc in tool_calls:
            tool_name = tc["name"]
            tool_args = tc.get("args") or {}
            tool_id = tc["id"]

            log("TOOL CALL", {"tool": tool_name, "args": tool_args})

            raw = await tool_map[tool_name].ainvoke(tool_args)
            parsed = normalize_mcp_result(raw)

            log("TOOL RESULT parsed", parsed)

            messages.append(
                ToolMessage(
                    tool_call_id=tool_id,
                    content=json.dumps(parsed),
                )
            )

    # ✅ Extract URLs from tool responses
    job_urls = []
    for m in messages:
        if isinstance(m, ToolMessage):
            try:
                data = json.loads(m.content)
                if isinstance(data, dict) and "job_urls" in data:
                    job_urls.extend(data["job_urls"])
            except:
                pass

    # unique list
    seen = set()
    job_urls = [u for u in job_urls if not (u in seen or seen.add(u))]

    log("Extracted job_urls", job_urls)

    return {**state, "job_urls": job_urls}


async def web_enrich_node(state: AppState) -> AppState:
    urls = state.get("job_urls", [])
    log("WEB ENRICH INPUT URLS", urls)

    if not urls:
        return {**state, "jobs": []}

    # Tavily search each url to get extracted content reliably
    results = tavily.extract(urls=urls[:5])

    log("TAVILY EXTRACT OUTPUT", results)

    jobs = []
    for item in results.get("results", []):
        url = item.get("url")
        title = item.get("title", "")
        raw_content = item.get("raw_content", "")

        jobs.append(parse_job_from_tavily(raw_content, title, url))

    log("PARSED JOBS (structured)", jobs)

    return {**state, "jobs": jobs}


async def final_job_answer_node(state: AppState) -> AppState:
    jobs = state.get("jobs", [])

    if not jobs:
        return {
            **state,
            "final_answer": "❌ I couldn't fetch LinkedIn job results because authentication failed (cookie expired/invalid). Please refresh LINKEDIN_COOKIE (li_at) and restart the MCP server."
        }
    user_input = state["user_input"]

    system = SystemMessage(content="""
You are an expert job assistant.

You will receive a JSON list of jobs (each job may have missing fields).
Your job is to present them in a clean, readable format.

RULES:
- Do NOT hallucinate any job info. Use ONLY the given JSON.
- If some fields are missing, skip them.
- Keep descriptions concise.

OUTPUT FORMAT (must follow exactly):

## ✅ Top Matches (Quick List)
1) <Job Title> — <Company> (<Location>)  
   Link: <URL>

2) ...

---

## 📌 Job Details

### 1) <Job Title> — <Company>
- Location:
- Posted:
- Work mode:
- Stipend:
- description and technologies required: (2–4 bullet points)
- Link:

### 2) ...

---

## ⭐ Recommendation
**Best pick:** <Job Title> — <Company>  
**Why:** (3 bullet points)
**Who should apply:** (1–2 lines)
                           
it should feel like a professional help and paragraph and point wise suggestions and explaination of the jobs is manadatory.
""")


    context = HumanMessage(content=f"""
User request:
{user_input}

Structured job results JSON:
{json.dumps(jobs, indent=2)}
""")

    resp = await llm.ainvoke([system, context])
    return {**state, "final_answer": resp.content}


# =======================
# Graph
# =======================
def route_condition(state: AppState) -> Literal["normal_chat", "job_flow"]:
    return "job_flow" if state["mode"] == "job" else "normal_chat"


def build_graph():
    g = StateGraph(AppState)

    g.add_node("route", route_node)
    g.add_node("normal_chat", normal_chat_node)

    g.add_node("mcp_agent", mcp_agent_node)
    g.add_node("web_enrich", web_enrich_node)
    g.add_node("final_job_answer", final_job_answer_node)

    g.set_entry_point("route")

    g.add_conditional_edges(
        "route",
        route_condition,
        {"normal_chat": "normal_chat", "job_flow": "mcp_agent"},
    )

    g.add_edge("normal_chat", END)

    g.add_edge("mcp_agent", "web_enrich")
    g.add_edge("web_enrich", "final_job_answer")
    g.add_edge("final_job_answer", END)

    return g.compile()


# =======================
# Run
# =======================
async def run_once(user_input: str):
    app = build_graph()

    state: AppState = {
        "mode": "normal",
        "user_input": user_input,
        "job_urls": [],
        "jobs": [],
        "final_answer": "",
    }

    result = await app.ainvoke(state)

    print("\n✅ FINAL OUTPUT:\n")
    print(result["final_answer"])


if __name__ == "__main__":
    asyncio.run(run_once("i am a software testing jobs in Telangana from LinkedIn, i am very interested in using tools which are used for testing"))
