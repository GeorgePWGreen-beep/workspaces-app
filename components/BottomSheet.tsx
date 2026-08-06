"use client";

import { Cafe } from "@/types/cafe";

export default function BottomSheet({
  selectedCafe,
}: {
  selectedCafe: Cafe | null;
}) {
  if (!selectedCafe) return null;

  return (
    <div className="
md:hidden
absolute
bottom-0
left-0
right-0
bg-white/95
backdrop-blur-xl
rounded-t-[32px]
shadow-2xl
p-6
z-50
animate-in
slide-in-from-bottom
duration-300
border-t
border-slate-200
">

      <div className="flex justify-center mb-5">
    <div className="w-14 h-1.5 rounded-full bg-slate-300" />
</div>

      <div className="flex justify-between items-center">

    <div>
        <h2 className="text-2xl font-bold text-slate-800">
            {selectedCafe.name}
        </h2>

        <p className="text-slate-500 mt-1">
            🚶 {selectedCafe.walkTime} min walk
        </p>
    </div>

    <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-2xl font-semibold">
        ⭐ {selectedCafe.rating}
    </div>

</div>

      <div className="flex gap-2 mt-4 flex-wrap">

        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">
          📶 {selectedCafe.wifi}
        </span>

        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
          🔇 {selectedCafe.noise}
        </span>

        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
          🔌 {selectedCafe.sockets}
        </span>

      </div>

    </div>
  );
}