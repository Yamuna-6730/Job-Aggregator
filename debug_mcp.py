import asyncio
import sys
import os

# Ensure we can import from the current environment packages
# (Assuming the valid environment is active in the shell where we run this)

from langchain_mcp_adapters.client import MultiServerMCPClient

async def main():
    servers = {
        "linkedin": {
            "transport": "streamable-http",
            "url": "http://127.0.0.1:8080/mcp",
        }
    }
    print(f"Connecting to servers: {servers}")
    client = MultiServerMCPClient(servers)
    try:
        print("Fetching tools...")
        tools = await client.get_tools()
        tool_names = [t.name for t in tools]
        print(f"Tools found: {tool_names}")
        with open("mcp_tools.json", "w", encoding="utf-8") as f:
            f.write(str(tool_names))
        
        tool_name = "search_jobs"
        target_tool = next((t for t in tools if t.name == tool_name), None)
        
        if target_tool:
            print(f"Invoking {tool_name}...")
            # Use the user's query
            args = {"keywords": "machine learning engineer", "location": "Telangana", "limit": 3}
            print(f"Args: {args}")
            result = await target_tool.ainvoke(args)
            print("Result received!")
            import json
            with open("mcp_output.json", "w", encoding="utf-8") as f:
                f.write(str(result)) # write raw structure representation
            print("Wrote result to mcp_output.json")
        else:
            print(f"Tool {tool_name} not found")
            
    except Exception as e:
        print(f"Error occurred: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
