"use client";

import { Cafe } from "@/types/cafe";

interface CafeCardProps {
  cafe: Cafe;
  selected: boolean;
  onClick: () => void;
}

export default function CafeCard({
  cafe,
  selected,
  onClick,
}: CafeCardProps) {
  return (
    <div
      onClick={onClick}
      className={`group rounded-3xl bg-white border border-slate-200 p-5 cursor-pointer transition-all duration-300 ${
        selected
          ? "ring-2 ring-blue-500 shadow-xl"
          : "hover:-translate-y-1 hover:shadow-xl"
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center text-xl">
            ☕
          </div>

          <div>
            <h2 className="font-bold text-lg text-slate-800">
              {cafe.name}
            </h2>
          </div>
        </div>

        <div className="bg-amber-50 text-amber-700 rounded-full px-3 py-1 text-sm font-semibold">
          ⭐ {cafe.rating}
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <div className="px-3 py-1 rounded-full bg-slate-100 text-sm text-slate-700">
          💷 {cafe.price}
        </div>

        <div className="px-3 py-1 rounded-full bg-slate-100 text-sm text-slate-700">
          🚶 {cafe.walkTime} min
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
          📶 {cafe.wifi}
        </div>

        <div className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm">
          🔇 {cafe.noise}
        </div>

        <div className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm">
          🔌 {cafe.sockets}
        </div>
      </div>
    </div>
  );
}