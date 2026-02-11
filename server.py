import os
import sys
import uvicorn
import hashlib
import json
import asyncio
import traceback
from fastapi import FastAPI, HTTPException, Body
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import build_graph
from config import AppState, log
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser

app = FastAPI(title="PBL Client API")

# Allow CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =======================
# CACHE
# =======================
# search_cache: query_key -> list of job dicts
search_cache: Dict[str, List[Dict[str, Any]]] = {}

# resume_cache: cache_key -> list of job dicts (ranked)
resume_cache: Dict[str, List[Dict[str, Any]]] = {}

# =======================
# MODELS
# =======================

class ChatRequest(BaseModel):
    query: str
    mode: str = "normal"  # "normal" or "job"
    limit: int = 5

class ChatStreamRequest(BaseModel):
    query: str
    mode: str = "normal"  # "normal" or "job"
    limit: int = 5
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    final_answer: Optional[str] = None
    structured_data: Optional[Dict[str, Any]] = None
    job_urls: Optional[List[str]] = None
    status: str = "success"

class JobCard(BaseModel):
    id: str
    job_title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    work_mode: Optional[str] = "Unknown"
    skills_required: List[str] = Field(default_factory=list)
    summary: Optional[str] = None
    source_url: Optional[str] = None
    match_reason: Optional[str] = None 

class SearchRequest(BaseModel):
    query: str
    page: int = 1
    page_size: int = 4

class SearchResponse(BaseModel):
    jobs: List[JobCard]
    page: int
    page_size: int
    has_more: bool

class RecommendRequest(BaseModel):
    query: str
    # Personal Details (Optional)
    resume_text: Optional[str] = None
    user_name: Optional[str] = None
    user_age: Optional[int] = None
    tech_skills: Optional[List[str]] = None
    experience: Optional[str] = None
    
    page: int = 1
    page_size: int = 4

# =======================
# HELPERS
# =======================
graph_app = build_graph()

llm_ranker = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.1,
    google_api_key=os.getenv("GOOGLE_API_KEY_2")
)

def get_query_key(query: str) -> str:
    return query.strip().lower()

def get_recommend_key(req: RecommendRequest) -> str:
    # Create a unique key based on all personal inputs
    key_parts = [
        req.query.strip().lower(),
        req.resume_text or "",
        req.user_name or "",
        str(req.user_age or ""),
        ",".join(sorted(req.tech_skills or [])),
        req.experience or ""
    ]
    raw = "|".join(key_parts)
    return hashlib.md5(raw.encode("utf-8")).hexdigest()

def generate_job_id(source_url: Optional[str]) -> str:
    if not source_url:
        return hashlib.md5(b"unknown").hexdigest()
    return hashlib.md5(source_url.encode("utf-8")).hexdigest()

async def fetch_jobs_from_graph(query: str, limit: int = 8) -> List[Dict[str, Any]]:
    """
    Invokes the LangGraph agent to find jobs.
    """
    initial_state: AppState = {
        "user_input": query,
        "mode": "job",
        "limit": limit,
        "job_urls": [],
        "jobs": [],
        "keywords": [],
        "location": [],
        "structured_data": {},
        "final_answer": "",
    }
    
    print(f"DEBUG: Invoking graph for query='{query}' limit={limit}")
    try:
        result = await graph_app.ainvoke(initial_state)
    except Exception as e:
        print(f"ERROR: Graph invocation failed: {e}")
        traceback.print_exc()
        return []
    
    structured = result.get("structured_data", {})
    if not structured:
        return []
        
    jobs = structured.get("jobs", [])
    
    # Process jobs to ensure they have IDs and cleanup
    processed_jobs = []
    seen_urls = set()
    
    for job in jobs:
        url = job.get("source_url")
        if url and url in seen_urls:
            continue
        if url:
            seen_urls.add(url)
            
        job["id"] = generate_job_id(url)
        processed_jobs.append(job)
        
    return processed_jobs

async def rank_jobs(jobs: List[Dict[str, Any]], req: RecommendRequest) -> List[Dict[str, Any]]:
    """
    Re-ranks jobs based on resume AND/OR personal details using LLM.
    """
    if not jobs:
        return []

    # Construct the user profile string
    profile_str = ""
    if req.user_name:
        profile_str += f"Candidate Name: {req.user_name}\n"
    if req.user_age:
        profile_str += f"Age: {req.user_age}\n"
    if req.tech_skills:
        profile_str += f"Technical Skills: {', '.join(req.tech_skills)}\n"
    if req.experience:
        profile_str += f"Experience Summary: {req.experience}\n"
    
    if req.resume_text:
        profile_str += f"\n--- RESUME CONTENT ---\n{req.resume_text}\n"

    if not profile_str.strip():
        # No intro info provided, return original order
        return jobs

    prompt_template = """
You are an expert HR recruiter.
I will provide a CANDIDATE PROFILE and a list of JOBS.
The CANDIDATE PROFILE contains specific details (Name, Age, Skills, Experience) AND/OR a Resume.

TASK:
1. Analyze the Technical Skills and Experience in the profile deeply.
2. Rank the JOBS based on how well they match the stated skills and experience.
3. Add a "match_reason" field to each job. 
   - The match reason MUST explicitly mention how the job fits the candidate's specific skills (e.g., "Matches your Python and React skills...") or experience.
   - If the candidate name is provided, address the candidate professionally if appropriate, or just keep it objective.

CANDIDATE PROFILE:
{profile}

JOBS:
{jobs_json}

OUTPUT JSON (list of objects with 'id' and 'match_reason'):
"""
    prompt = PromptTemplate(template=prompt_template, input_variables=["profile", "jobs_json"])
    chain = prompt | llm_ranker | JsonOutputParser()
    
    # Lightweight job list
    jobs_input = []
    for j in jobs:
        jobs_input.append({
            "id": j.get("id"),
            "job_title": j.get("job_title"),
            "company": j.get("company"),
            "skills_required": j.get("skills_required"),
            "summary": j.get("summary")
        })

    try:
        ranked_output = await chain.ainvoke({"profile": profile_str, "jobs_json": json.dumps(jobs_input)})
        
        # Create a map of id -> match_reason
        match_map = {item.get("id"): item.get("match_reason", "Matches profile.") for item in ranked_output}
        
        # Create a map of id -> original job
        job_map = {j["id"]: j for j in jobs}
        
        final_list = []
        # Iterate through ranked_output to preserve order
        for item in ranked_output:
            jid = item.get("id")
            if jid in job_map:
                original_job = job_map[jid]
                original_job["match_reason"] = match_map.get(jid)
                final_list.append(original_job)
                
        # Add any remaining jobs that weren't returned by LLM (fallback) at the end
        ranked_ids = set(match_map.keys())
        for j in jobs:
            if j["id"] not in ranked_ids:
                j["match_reason"] = "Standard match."
                final_list.append(j)
                
        return final_list
        
    except Exception as e:
        print(f"Ranking error: {e}")
        traceback.print_exc()
        return jobs

# =======================
# ENDPOINTS
# =======================

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Existing chat endpoint (legacy).
    """
    try:
        initial_state: AppState = {
            "user_input": request.query,
            "mode": request.mode,
            "limit": request.limit,
            "job_urls": [],
            "jobs": [],
            "keywords": [],
            "location": [],
            "structured_data": {},
            "final_answer": "",
        }

        result = await graph_app.ainvoke(initial_state)

        return ChatResponse(
            final_answer=result.get("final_answer"),
            structured_data=result.get("structured_data"),
            job_urls=result.get("job_urls"),
            status="success"
        )
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/stream")
async def chat_stream_endpoint(request: ChatStreamRequest):
    """
    Streaming chat endpoint (SSE).
    Emits:
      - event: status (Thinking..., Searching...)
      - event: token (assistant text chunks)
      - event: final (final JSON payload)
    """
    def sse(event: str, data: str) -> str:
        # SSE supports multiple data: lines for newlines
        lines = data.splitlines() or [""]
        return f"event: {event}\n" + "\n".join([f"data:{line}" for line in lines]) + "\n\n"

    async def gen():
        try:
            yield sse("status", "Thinking...")
            await asyncio.sleep(0.15)
            yield sse("status", "Searching...")

            initial_state: AppState = {
                "user_input": request.query,
                "mode": request.mode,
                "limit": request.limit,
                "job_urls": [],
                "jobs": [],
                "keywords": [],
                "location": [],
                "structured_data": {},
                "final_answer": "",
            }

            task = asyncio.create_task(graph_app.ainvoke(initial_state))

            # Keep connection alive while graph runs
            while not task.done():
                await asyncio.sleep(1.0)
                yield sse("status", "Searching...")

            result = await task

            final_answer = result.get("final_answer") or ""
            structured_data = result.get("structured_data")
            job_urls = result.get("job_urls")

            # Progressive reveal (best-effort) after computation
            chunk_size = 18
            for i in range(0, len(final_answer), chunk_size):
                yield sse("token", final_answer[i : i + chunk_size])
                await asyncio.sleep(0)

            payload = {
                "final_answer": final_answer,
                "structured_data": structured_data,
                "job_urls": job_urls,
                "status": "success",
                "session_id": request.session_id,
            }
            yield sse("final", json.dumps(payload))
        except Exception as e:
            print(f"Error in chat stream endpoint: {e}")
            traceback.print_exc()
            yield sse("final", json.dumps({"status": "error", "detail": str(e)}))

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )

@app.post("/jobs/search", response_model=SearchResponse)
async def search_jobs(request: SearchRequest):
    try:
        query_key = get_query_key(request.query)
        
        print(f"SEARCH REQUEST: query='{request.query}' page={request.page}")
        
        # 1. Check Cache
        if query_key in search_cache:
            all_jobs = search_cache[query_key]
        else:
            # 2. Fetch if not cached
            print("Cache miss. Fetching from graph...")
            all_jobs = await fetch_jobs_from_graph(request.query, limit=12)
            if all_jobs:
                search_cache[query_key] = all_jobs
        
        # 3. Pagination
        start = (request.page - 1) * request.page_size
        end = start + request.page_size
        
        if start >= len(all_jobs):
            paginated_jobs = []
        else:
            paginated_jobs = all_jobs[start:end]
            
        has_more = end < len(all_jobs)
        
        return SearchResponse(
            jobs=paginated_jobs,
            page=request.page,
            page_size=request.page_size,
            has_more=has_more
        )
    except Exception as e:
        print(f"Error in search_jobs endpoint: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/jobs/recommend-with-resume", response_model=SearchResponse)
async def recommend_jobs(request: RecommendRequest):
    try:
        query_key = get_query_key(request.query)
        rec_key = get_recommend_key(request)
        
        print(f"RECOMMEND REQUEST: query='{request.query}'")
        
        # 1. Check Personalization Cache
        if rec_key in resume_cache:
            ranked_jobs = resume_cache[rec_key]
        else:
            # 2. Check Search Cache for base jobs
            if query_key in search_cache:
                base_jobs = search_cache[query_key]
            else:
                base_jobs = await fetch_jobs_from_graph(request.query, limit=12)
                if base_jobs:
                    search_cache[query_key] = base_jobs
            
            # 3. Rank
            ranked_jobs = await rank_jobs(base_jobs, request)
            resume_cache[rec_key] = ranked_jobs
            
        # 4. Pagination
        start = (request.page - 1) * request.page_size
        end = start + request.page_size
        
        if start >= len(ranked_jobs):
            paginated_jobs = []
        else:
            paginated_jobs = ranked_jobs[start:end]
            
        has_more = end < len(ranked_jobs)
        
        return SearchResponse(
            jobs=paginated_jobs,
            page=request.page,
            page_size=request.page_size,
            has_more=has_more
        )
    except Exception as e:
        print(f"Error in recommend_jobs endpoint: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/jobs/initial", response_model=SearchResponse)
async def get_initial_jobs():
    """
    Fetches 3 initial jobs to display on the chat interface before any user query.
    Uses a default query 'Software Engineer' to populate.
    """
    try:
        # Default query to fetch initial jobs
        default_query = "Software Engineer"
        limit = 4
        
        # Reuse search_jobs logic or fetch directly
        query_key = get_query_key(default_query)
        
        if query_key in search_cache:
            all_jobs = search_cache[query_key]
        else:
            all_jobs = await fetch_jobs_from_graph(default_query, limit=limit)
            if all_jobs:
                search_cache[query_key] = all_jobs
                
        # Take top 3
        initial_jobs = all_jobs[:limit] if all_jobs else []
        
        return SearchResponse(
            jobs=initial_jobs,
            page=1,
            page_size=limit,
            has_more=len(all_jobs) > limit
        )
    except Exception as e:
        print(f"Error in initial jobs endpoint: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=4000, reload=True)
