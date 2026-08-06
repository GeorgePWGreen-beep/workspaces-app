"use client";

export default function FloatingSearch() {
  return (
    <div className="md:hidden absolute top-4 left-4 right-4 z-50">

      <input
        type="text"
        placeholder="🔍 Search workspaces..."
        className="
          w-full
          rounded-2xl
          bg-white
          px-5
          py-4
          shadow-xl
          border
          border-slate-200
          outline-none
        "
      />

    </div>
  );
}