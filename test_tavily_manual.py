from tavily import TavilyClient
import json

# Initialize Client (Using the key found in codebase)
tavily_client = TavilyClient(api_key="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")

def test_tavily():
    print("1. Searching for a LinkedIn Job URL...")
    # Search for a fresh LinkedIn job
    # search_res = tavily_client.sc(
    #     query="site:linkedin.com/jobs/view/4365685012/",
    #     search_depth="basic",
    #     max_results=1
    # )
    
    # urls = [r["url"] for r in search_res.get("results", [])]
    # if not urls:
    #     print("No LinkedIn URLs found via search.")
    #     return

    # target_url = urls[0]
    target_url = "https://www.linkedin.com/jobs/view/4365685012/"
    print(f"Using Hardcoded URL: {target_url}")
    
    print("\n2. Attempting Extraction...")
    try:
        # Extract
        extract_res = tavily_client.extract(urls=[target_url],extract_depth="advanced")
        
        print("\n--- Extraction Result ---")
        import json
        print(json.dumps(extract_res, indent=2))
        
        if "results" in extract_res:
            for item in extract_res["results"]:
                print(f"\nURL: {item.get('url')}")
                raw = item.get('raw_content', '')
                clean = item.get('content', '')
                print(f"Raw Content Length: {len(raw) if raw else 0}")
                print(f"Clean Content Length: {len(clean) if clean else 0}")
                
                if not raw and not clean:
                    print("\nWARNING: Both raw_content and content are empty!")
        else:
            print("No 'results' key in response.")
            
    except Exception as e:
        print(f"Extraction failed: {e}")

if __name__ == "__main__":
    test_tavily()
