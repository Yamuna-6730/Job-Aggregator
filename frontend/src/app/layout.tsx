import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import clsx from 'clsx';
import { Navbar } from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'JobSage AI - Agentic Job Aggregator',
    description: 'Find your dream job with AI-powered recommendations.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={clsx(inter.className, "antialiased relative selection:bg-violet-500/30")}>
                {/* Background Gradients */}
                <div className="fixed inset-0 z-[-1] bg-white">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[128px] animate-float" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[128px] animate-float" style={{ animationDelay: '2s' }} />
                    <div className="absolute inset-0 bg-grid-pattern z-[-1]" />
                </div>

                <Navbar />
                {children}
            </body>
        </html>
    );
}

