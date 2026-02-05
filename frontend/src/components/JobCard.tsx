"use client";

import { ArrowUpRight, MapPin, Building2, Wallet, ChevronDown, X, Briefcase, GraduationCap } from "lucide-react";
import { Job } from "@/lib/api";
import { useState } from "react";

export default function JobCard({ job }: { job: Job }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract source from URL
  const getSource = (url: string) => {
    if (url.includes("linkedin.com")) return "LinkedIn";
    if (url.includes("indeed.com")) return "Indeed";
    if (url.includes("naukri.com")) return "Naukri";
    return "Job Portal";
  };

  // Convert salary to LPA/CPA format
  const formatSalary = (salary: string | undefined) => {
    if (!salary) return null;
    
    // Check if already formatted
    if (salary.includes("LPA") || salary.includes("CPA") || salary.includes("/month")) {
      return salary;
    }
    
    // Extract numbers from formats like "₹100,000.00/yr - ₹150,000.00/yr"
    const matches = salary.match(/₹([\d,]+(?:\.\d+)?)/g);
    if (matches && matches.length >= 1) {
      const amounts = matches.map(m => parseFloat(m.replace(/[₹,]/g, "")));
      
      if (amounts.length === 2) {
        // Range format
        const minLPA = (amounts[0] / 100000).toFixed(1);
        const maxLPA = (amounts[1] / 100000).toFixed(1);
        return `₹${minLPA}-${maxLPA} LPA`;
      } else if (amounts.length === 1) {
        // Single value
        if (amounts[0] >= 100000) {
          const lpa = (amounts[0] / 100000).toFixed(1);
          return `₹${lpa} LPA`;
        }
      }
    }
    
    return salary;
  };

  return (
    <>
      <div className="card-brutalist bg-white border border-black rounded-[45px]
        h-[420px] p-5 flex flex-col"
      >
        {/* Top content */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-start mb-3 flex-shrink-0">
            <div className="pr-2">
              <h3 className="text-lg font-bold text-black line-clamp-2">
                {job.job_title}
              </h3>
              <p className="text-gray-600 text-sm font-medium flex items-center gap-2 mt-1">
                <Building2 size={14} /> {job.company}
              </p>
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-2 my-3 text-xs text-black flex-shrink-0">
            <span className="flex items-center gap-1 border border-black px-2 py-1 rounded-md bg-white">
              <MapPin size={12} /> {job.location}
            </span>

            {job.salary_or_stipend && (
              <span className="flex items-center gap-1 border border-black px-2 py-1 rounded-md bg-white">
                <Wallet size={12} /> {formatSalary(job.salary_or_stipend)}
              </span>
            )}

            {job.work_mode && job.work_mode.toLowerCase() !== job.location.toLowerCase() && (
              <span className="flex items-center gap-1 border border-black px-2 py-1 rounded-md bg-white uppercase font-bold">
                {job.work_mode}
              </span>
            )}

            <span className="flex items-center gap-1 border border-black px-2 py-1 rounded-md bg-white uppercase font-bold">
              {getSource(job.source_url)}
            </span>
          </div>

          {/* Summary (clamped) */}
          {job.summary && (
            <div className="text-sm text-gray-700 flex-1 overflow-y-auto no-scrollbar pr-1 min-h-0">
              {job.summary}
            </div>
          )}
        </div>

        {/* CTA buttons */}
        <div className="mt-4 flex gap-3 flex-shrink-0">
          <button
            onClick={() => setIsExpanded(true)}
            className="flex-1 flex items-center justify-center gap-2
              bg-[#B9FF66] hover:bg-[#a8ef55] border-2 border-black text-black font-bold
              py-3 px-4 rounded-xl transition-all shadow-[2px_2px_0_#000]
              hover:shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px]"
          >
            Explore <ChevronDown size={18} />
          </button>
          <a
            href={job.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2
              bg-black hover:bg-black/90 text-white font-bold
              py-3 px-4 rounded-xl transition-all border-2 border-black
              shadow-[2px_2px_0_#000] hover:shadow-[3px_3px_0_#000]
              hover:translate-x-[-1px] hover:translate-y-[-1px]"
          >
            Apply <ArrowUpRight size={18} />
          </a>
        </div>
      </div>

      {/* Detailed Modal */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
        >
          <div className="bg-white border-4 border-black rounded-[48px] max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-[8px_8px_0_#191A23]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#B9FF66] border-b-4 border-black p-8 flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-4xl font-bold text-black mb-3">{job.job_title}</h2>
                <p className="text-xl text-black flex items-center gap-2 font-semibold">
                  <Building2 size={24} /> {job.company}
                </p>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-3 hover:bg-black hover:text-[#B9FF66] rounded-full transition-colors border-2 border-black bg-white text-black ml-4"
              >
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-280px)] p-8 space-y-8 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
              {/* Meta Info */}
              <div className="flex flex-wrap gap-3">
                <span className="flex items-center gap-2 border-2 border-black px-5 py-2 rounded-xl bg-white font-semibold shadow-[3px_3px_0_#191A23] text-black">
                  <MapPin size={18} /> {job.location}
                </span>
                {job.work_mode && job.work_mode.toLowerCase() !== job.location.toLowerCase() && (
                  <span className="flex items-center gap-2 border-2 border-black px-5 py-2 rounded-xl bg-[#B9FF66] font-semibold shadow-[3px_3px_0_#191A23] text-black">
                    {job.work_mode}
                  </span>
                )}
                {job.salary_or_stipend && (
                  <span className="flex items-center gap-2 border-2 border-black px-5 py-2 rounded-xl bg-white font-semibold shadow-[3px_3px_0_#191A23] text-black">
                    <Wallet size={18} /> {formatSalary(job.salary_or_stipend)}
                  </span>
                )}
                {job.experience_required && (
                  <span className="flex items-center gap-2 border-2 border-black px-5 py-2 rounded-xl bg-white font-semibold shadow-[3px_3px_0_#191A23] text-black">
                    <Briefcase size={18} /> {job.experience_required}
                  </span>
                )}
                {job.education && (
                  <span className="flex items-center gap-2 border-2 border-black px-5 py-2 rounded-xl bg-white font-semibold shadow-[3px_3px_0_#191A23] text-black">
                    <GraduationCap size={18} /> {job.education}
                  </span>
                )}
              </div>

              {/* Summary */}
              {job.summary && (
                <div className="bg-[#F3F3F3] border-2 border-black rounded-2xl p-6">
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-3 text-black">
                    <div className="w-2 h-8 bg-[#B9FF66] rounded-full"></div>
                    Summary
                  </h3>
                  <p className="text-gray-800 leading-relaxed text-lg">{job.summary}</p>
                </div>
              )}

              {/* Responsibilities */}
              {job.responsibilities && job.responsibilities.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-3 text-black">
                    <div className="w-2 h-8 bg-[#B9FF66] rounded-full"></div>
                    Responsibilities
                  </h3>
                  <ul className="space-y-3">
                    {job.responsibilities.map((item, idx) => (
                      <li key={idx} className="flex gap-3 text-gray-800 leading-relaxed">
                        <span className="text-[#B9FF66] font-bold text-xl flex-shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-3 text-black">
                    <div className="w-2 h-8 bg-[#B9FF66] rounded-full"></div>
                    Requirements
                  </h3>
                  <ul className="space-y-3">
                    {job.requirements.map((item, idx) => (
                      <li key={idx} className="flex gap-3 text-gray-800 leading-relaxed">
                        <span className="text-[#B9FF66] font-bold text-xl flex-shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skills */}
              {job.skills_required && job.skills_required.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-3 text-black">
                    <div className="w-2 h-8 bg-[#B9FF66] rounded-full"></div>
                    Skills Required
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {job.skills_required.map((skill, idx) => (
                      <span key={idx} className="border-2 border-black px-4 py-2 rounded-full text-sm font-semibold bg-white text-black shadow-[2px_2px_0_#191A23] hover:shadow-[3px_3px_0_#191A23] transition-shadow">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Job Description */}
              {job.job_description && (
                <div>
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-3 text-black">
                    <div className="w-2 h-8 bg-[#B9FF66] rounded-full"></div>
                    Full Description
                  </h3>
                  <div className="bg-[#F3F3F3] border-2 border-black rounded-2xl p-6">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-line">{job.job_description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Apply Button */}
            <div className="sticky bottom-0 bg-white border-t-4 border-black p-6">
              <a
                href={job.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full
                  bg-black hover:bg-black/90 text-white font-bold text-xl
                  py-5 px-6 rounded-2xl transition-all border-2 border-black
                  shadow-[4px_4px_0_#B9FF66] hover:shadow-[6px_6px_0_#B9FF66] hover:translate-x-[-2px] hover:translate-y-[-2px]"
              >
                Apply Now <ArrowUpRight size={24} />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}