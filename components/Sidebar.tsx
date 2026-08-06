"use client";

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

    const matchesWifi =
      !greatWifiOnly || cafe.wifi === "Great WiFi";

    const matchesQuiet =
      !quietOnly || cafe.noise === "Quiet";

    const matchesSockets =
      !plentySocketsOnly || cafe.sockets === "Plenty";

    return (
      matchesSearch &&
      matchesWifi &&
      matchesQuiet &&
      matchesSockets
    );
  });

  return (
    <div className="w-96 h-screen bg-slate-50 border-r border-slate-200 overflow-y-auto">
      <div className="p-4 border-b">
        <h1 className="text-3xl font-bold tracking-tight">
          Workspaces
        </h1>

        <p className="text-gray-500 mt-1 mb-5">
          Find your perfect study spot.
        </p>

        <input
          type="text"
          placeholder="🔍 Search cafés..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={() => setGreatWifiOnly(!greatWifiOnly)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              greatWifiOnly
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white border border-slate-200 hover:bg-slate-100"
            }`}
          >
            📶 Great WiFi
          </button>

          <button
            onClick={() => setQuietOnly(!quietOnly)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              quietOnly
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white border border-slate-200 hover:bg-slate-100"
            }`}
          >
            🔇 Quiet
          </button>

          <button
            onClick={() => setPlentySocketsOnly(!plentySocketsOnly)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              plentySocketsOnly
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white border border-slate-200 hover:bg-slate-100"
            }`}
          >
            🔌 Sockets
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
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