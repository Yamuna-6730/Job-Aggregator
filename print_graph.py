import sys
import os

# Ensure we can import from the current directory
sys.path.insert(0, os.getcwd())

from main import build_graph

def print_workflow_graph():
    try:
        app = build_graph()
        
        print("\n=== Workflow Graph (ASCII) ===\n")
        try:
            print(app.get_graph().draw_ascii())
        except Exception as e:
            print(f"Could not draw ASCII: {e}")

        print("\n=== Workflow Graph (Mermaid) ===\n")
        try:
            mermaid_graph = app.get_graph().draw_mermaid()
            print(mermaid_graph)
            with open("graph.mermaid", "w", encoding="utf-8") as f:
                f.write(mermaid_graph)
        except Exception as e:
            print(f"Could not draw Mermaid: {e}")
            
    except Exception as e:
        print(f"Error building graph: {e}")

if __name__ == "__main__":
    print_workflow_graph()
