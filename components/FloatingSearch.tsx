"use client";

import { Search } from "lucide-react";

export default function FloatingSearch() {
  return (
    <div className="md:hidden absolute top-4 left-4 right-4 z-50">
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
          strokeWidth={2}
        />
        <input
          type="text"
          placeholder="Search workspaces..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-5 text-[#111827] shadow-xl outline-none placeholder:text-slate-500 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
        />
      </div>
    </div>
  );
}
