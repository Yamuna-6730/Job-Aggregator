"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // ✅ Hide navbar completely on chat page
    if (pathname === "/chat") return null;

    const isActive = (path: string) =>
        pathname === path
            ? "text-[#B9FF66]"
            : "text-black hover:text-[#B9FF66]";

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-black">
            <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <span className="text-xl font-bold tracking-tight uppercase text-black">
                        JobSage.ai
                    </span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8 font-bold text-sm tracking-widest uppercase">
                    <Link href="/" className={`transition-colors ${isActive("/")}`}>
                        HOME
                    </Link>
                    <Link
                        href="/how-it-works"
                        className={`transition-colors ${isActive("/how-it-works")}`}
                    >
                        HOW IT WORKS
                    </Link>
                    <Link
                        href="/features"
                        className={`transition-colors ${isActive("/features")}`}
                    >
                        FEATURES
                    </Link>
                    <Link
                        href="/use-cases"
                        className={`transition-colors ${isActive("/use-cases")}`}
                    >
                        USE CASES
                    </Link>

                    <Link
                        href="/get-started"
                        className="bg-black text-[#B9FF66] px-6 py-2 rounded-full font-bold uppercase tracking-wider hover:bg-[#B9FF66] hover:text-black transition-all duration-300 border border-black"
                    >
                        Get Started
                    </Link>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden p-2"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle Menu"
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-white border-b border-black p-4 flex flex-col gap-4 font-medium animate-in slide-in-from-top-4">
                    <Link
                        href="/"
                        onClick={() => setIsOpen(false)}
                        className={`uppercase font-bold ${isActive("/")}`}
                    >
                        Home
                    </Link>
                    <Link
                        href="/how-it-works"
                        onClick={() => setIsOpen(false)}
                        className={`uppercase font-bold ${isActive("/how-it-works")}`}
                    >
                        How It Works
                    </Link>
                    <Link
                        href="/features"
                        onClick={() => setIsOpen(false)}
                        className={`uppercase font-bold ${isActive("/features")}`}
                    >
                        Features
                    </Link>
                    <Link
                        href="/use-cases"
                        onClick={() => setIsOpen(false)}
                        className={`uppercase font-bold ${isActive("/use-cases")}`}
                    >
                        Use Cases
                    </Link>
                    <Link
                        href="/get-started"
                        onClick={() => setIsOpen(false)}
                        className="bg-black text-[#B9FF66] px-6 py-3 rounded-full font-bold uppercase text-center hover:bg-[#B9FF66] hover:text-black transition-all"
                    >
                        Get Started
                    </Link>
                </div>
            )}
        </nav>
    );
}
