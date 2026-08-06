"use client";

import { Cafe } from "@/types/cafe";
import CafeDetails from "./CafeDetails";

export default function BottomSheet({
  selectedCafe,
}: {
  selectedCafe: Cafe | null;
}) {
  if (!selectedCafe) return null;

  return (
    <div
      className="
        md:hidden
        absolute
        bottom-0
        left-0
        right-0
        bg-white/95
        backdrop-blur-xl
        rounded-t-[32px]
        shadow-2xl
        z-50
        animate-in
        slide-in-from-bottom
        duration-300
        overflow-hidden
      "
    >
      <div className="flex justify-center pt-4">
        <div className="w-14 h-1.5 rounded-full bg-slate-300" />
      </div>

      <CafeDetails cafe={selectedCafe} />
    </div>
  );
}