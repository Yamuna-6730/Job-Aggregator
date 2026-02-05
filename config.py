"""
Shared configuration, types, and utilities
"""
import json
from typing import TypedDict, List, Dict, Any, Literal, Optional, Annotated
import operator


# =======================
# STATE
# =======================
# class AppState(TypedDict):
#     mode: Literal["normal", "job"]
#     user_input: str
#     job_urls: List[str]
#     jobs: List[dict]
#     final_answer: str



class AppState(TypedDict, total=False):
    # --- core ---
    user_input: str
    mode: Literal["normal", "job"]

    keywords: Annotated[List[str], operator.add] # ✅ multiple keywords
    location: Annotated[List[str], operator.add]
    limit: Optional[int]

    # --- collected URLs from sources ---
    job_urls: Annotated[List[str], operator.add]   # LinkedIn + Indeed URLs
    # --- raw extracted content (scraped docs) ---
    jobs: Annotated[List[Dict[str, Any]], operator.add]  
    # --- structured output (Gemini Pydantic -> dict) ---
    structured_data: Optional[Dict[str, Any]]
    # --- final formatted response ---
    final_answer: Optional[str]
# =======================
# LOGGING
# =======================
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
