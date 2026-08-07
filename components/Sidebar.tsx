"use client";

import { PlugZap, Search, VolumeX, Wifi } from "lucide-react";
import { useState } from "react";
import { cafes } from "@/data/cafes";
import { Cafe } from "@/types/cafe";
import CafeCard from "./CafeCard";

export default function Sidebar({
  selectedCafe,
  setSelectedCafe,
}: {
  selectedCafe: Cafe | null;
  setSelectedCafe: (cafe: Cafe) => void;
}) {
  const [search, setSearch] = useState("");
  const [greatWifiOnly, setGreatWifiOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [plentySocketsOnly, setPlentySocketsOnly] = useState(false);

  const filteredCafes = cafes.filter((cafe) => {
    const matchesSearch = cafe.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesWifi = !greatWifiOnly || cafe.wifi === "Great WiFi";
    const matchesQuiet = !quietOnly || cafe.noise === "Quiet";
    const matchesSockets = !plentySocketsOnly || cafe.sockets === "Plenty";

    return matchesSearch && matchesWifi && matchesQuiet && matchesSockets;
  });

  return (
    <div className="h-screen w-96 overflow-y-auto border-r border-slate-200 bg-slate-50">
      <div className="border-b border-slate-200 p-4">
        <h1 className="text-3xl font-bold tracking-tight text-[#111827]">
          Workspaces
        </h1>

        <p className="mb-5 mt-1 text-[#4B5563]">
          Find your perfect study spot.
        </p>

        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            strokeWidth={2}
          />
          <input
            type="text"
            placeholder="Search cafes..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-[#111827] shadow-sm outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setGreatWifiOnly(!greatWifiOnly)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
              greatWifiOnly
                ? "bg-blue-600 text-white shadow-md"
                : "border border-slate-200 bg-white text-[#4B5563] hover:bg-slate-100"
            }`}
          >
            <Wifi aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
            Great WiFi
          </button>

          <button
            type="button"
            onClick={() => setQuietOnly(!quietOnly)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
              quietOnly
                ? "bg-blue-600 text-white shadow-md"
                : "border border-slate-200 bg-white text-[#4B5563] hover:bg-slate-100"
            }`}
          >
            <VolumeX aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
            Quiet
          </button>

          <button
            type="button"
            onClick={() => setPlentySocketsOnly(!plentySocketsOnly)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
              plentySocketsOnly
                ? "bg-blue-600 text-white shadow-md"
                : "border border-slate-200 bg-white text-[#4B5563] hover:bg-slate-100"
            }`}
          >
            <PlugZap aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
            Sockets
          </button>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {filteredCafes.map((cafe) => (
          <CafeCard
            key={cafe.name}
            cafe={cafe}
            selected={selectedCafe?.name === cafe.name}
            onClick={() => setSelectedCafe(cafe)}
          />
        ))}
      </div>
    </div>
  );
}
