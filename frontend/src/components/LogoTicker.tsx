"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const logos = [
    { name: "LinkedIn", sr: "/logos/linkedin.png" },
    { name: "Indeed", sr: "/logos/indeed.png" },
    { name: "Glassdoor", sr: "/logos/glassdoor.png" },
    { name: "Naukri", sr: "/logos/naukri.png" },
    { name: "Google", sr: "/logos/google.png" },
];

export default function LogoTicker() {
    return (
        <div className="py-12 overflow-hidden relative">
            <div className="flex">
                <motion.div
                    className="flex gap-20 items-center flex-nowrap pr-20"
                    animate={{ x: "-50%" }}
                    transition={{
                        duration: 30,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                >
                    {/* Tripled to ensure smooth loop for wider screens */}
                    {[...logos, ...logos, ...logos].map((logo, idx) => (
                        <div key={idx} className="relative h-12 w-32 md:h-14 md:w-40 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
                            <Image
                                src={logo.sr}
                                alt={logo.name + " Logo"}
                                fill
                                className="object-contain"
                            />
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
