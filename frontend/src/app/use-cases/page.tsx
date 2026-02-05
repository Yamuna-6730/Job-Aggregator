import TestimonialCard from "@/components/TestimonialCard";

export default function UseCases() {
    const cases = [
        {
            quote: "I applied to 50 jobs manually and heard nothing. JobSage found me a hidden opening at a startup that matched my obscure skill set perfectly.",
            author: "Sarah J.",
            role: "Data Scientist",
            bgColor: "bg-white"
        },
        {
            quote: "As a fresher, I didn't verify if I was eligible. The agent filtered out 80% of jobs requiring 3+ years experience, saving me hours.",
            author: "Mike T.",
            role: "College Grad",
            bgColor: "bg-[#B9FF66]"
        },
        {
            quote: "I needed a remote role strictly. The structuring engine is scary accurate at detecting 'Hybrid' roles disguised as Remote.",
            author: "Elena R.",
            role: "Senior Dev",
            bgColor: "bg-[#F3F3F3]"
        }
    ];

    return (
        <main className="min-h-screen bg-white pt-32 pb-20">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-20">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6"><span className="text-[#B9FF66] bg-black px-2 rounded-lg">Results</span></h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        See how JobSage is changing the job search game for everyone from students to veterans.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {cases.map((c, idx) => (
                        <TestimonialCard key={idx} {...c} />
                    ))}
                </div>
            </div>
        </main>
    );
}
