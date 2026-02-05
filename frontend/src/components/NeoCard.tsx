import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface NeoCardProps {
    children: ReactNode;
    className?: string;
    color?: "white" | "lime" | "yellow" | "lavender" | "black";
}

export function NeoCard({ children, className, color = "white" }: NeoCardProps) {
    const colorStyles = {
        white: "bg-white text-black",
        lime: "bg-[#B9FF66] text-black",
        yellow: "bg-[#FFD700] text-black",
        lavender: "bg-[#E6E6FA] text-black",
        black: "bg-black text-white",
    };

    return (
        <div
            className={cn(
                "border-2 border-black rounded-[2rem] p-8 relative transition-transform hover:-translate-y-1",
                "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
                colorStyles[color],
                className
            )}
        >
            {children}
        </div>
    );
}
