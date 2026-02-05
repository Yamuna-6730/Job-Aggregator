import { Star } from "lucide-react";
import { NeoCard } from "./NeoCard";

interface TestimonialProps {
    quote: string;
    author: string;
    role: string;
    bgColor: string;
}

export default function TestimonialCard({ quote, author, role, bgColor }: TestimonialProps) {
    let cardColor: "white" | "lime" | "lavender" = "white";
    if (bgColor.includes("#B9FF66")) cardColor = "lime";
    if (bgColor.includes("#F3F3F3")) cardColor = "lavender";

    return (
        <NeoCard color={cardColor} className="flex flex-col justify-between min-h-[300px]">
            <div>
                <div className="flex gap-1 mb-6 text-black">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} size={20} fill="black" />
                    ))}
                </div>
                <p className="text-xl font-medium leading-relaxed mb-6">"{quote}"</p>
            </div>

            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black rounded-full" /> {/* Placeholder Avatar */}
                <div>
                    <h4 className="font-bold text-lg">{author}</h4>
                    <p className="text-sm opacity-80 uppercase tracking-wider">{role}</p>
                </div>
            </div>
        </NeoCard>
    );
}
