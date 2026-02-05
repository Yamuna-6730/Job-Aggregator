import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

SERVERS = {
    "linkedin": {
        "transport": "streamable-http",
        "url": "http://127.0.0.1:8080/mcp",
    }
}

# Use a singleton class or container to avoid import shadowing issues
class MCPCache:
    tools = None
    tool_map = None

def get_mcp_cache():
    return MCPCache

def reset_mcp_cache():
    MCPCache.tools = None
    MCPCache.tool_map = None
