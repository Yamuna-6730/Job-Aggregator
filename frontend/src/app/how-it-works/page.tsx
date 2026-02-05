import Accordion from "@/components/Accordion";

export default function HowItWorks() {
    const steps = [
        {
            title: "Query Understanding",
            content: "First, our Agentic Router analyzes your natural language request. It distinguishes between simple questions (handled by Gemini Flash) and complex job searches that require real-time data fetching."
        },
        {
            title: "Multi-Source Search",
            content: "The agent dispatches crawlers to LinkedIn (via MCP), Indeed, and Glassdoor simultaneously. It uses Firecrawl to navigate dynamic pages and bypass basic bot protection to gather raw job listings."
        },
        {
            title: "Intelligent Extraction",
            content: "Raw HTML is messy. We pass the scraped content through a Pydantic-powered structure node. Gemini 2.0 extracts key fields like 'Salary', 'Remote Status', and 'Tech Stack' into a standardized JSON format."
        },
        {
            title: "Matching & Scoring",
            content: "We don't just list jobs. The Recommendation Engine compares your profile/query against each listing, assigning a 'Match %' and generating a personalized reason why you should (or shouldn't) apply."
        }
    ];

    return (
        <main className="min-h-screen bg-[#F3F3F3] pt-32 pb-20">
            <div className="max-w-4xl mx-auto px-6">
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-5xl md:text-6xl font-bold text-black">How <span className="text-[#B9FF66] bg-black px-2 rounded-lg">It Works</span></h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Peek under the hood of our agentic workflow. No magic, just smart engineering.
                    </p>
                </div>

                <div className="grid md:grid-cols-1 gap-12 items-start">
                    <Accordion items={steps} />

                    {/* Visual representation could go here in a future update (Mermaid diagram / SVG) */}
                </div>
            </div>
        </main>
    );
}
