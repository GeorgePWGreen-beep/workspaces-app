"use client";

import { useState } from "react";
import { cafes } from "@/data/cafes";
import { Cafe } from "@/types/cafe";

export default function Sidebar({
    selectedCafe,
    setSelectedCafe,
}: {
    selectedCafe: Cafe | null;
    setSelectedCafe: (cafe: Cafe) => void;
}) {
    const [search, setSearch] = useState("");

    const filteredCafes = cafes.filter((cafe) =>
        cafe.name.toLowerCase().includes(search.toLowerCase())
    );
    return (
        <div className="w-80 h-full bg-white shadow-lg overflow-y-auto">
            <div className="p-4 border-b">
                <h1 className="text-2xl font-bold">Workspaces</h1>

                <p className="text-gray-500 text-sm mb-4">
                    Find the perfect place to work.
                </p>

                <input
                    type="text"
                    placeholder="🔍 Search cafés..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border p-2"
                />
            </div>

            <div className="p-4 space-y-3">
                {filteredCafes.map((cafe) => (
                    <div
                        key={cafe.name}
                        onClick={() => setSelectedCafe(cafe)}
                        className={`border rounded-lg p-3 cursor-pointer transition ${selectedCafe?.name === cafe.name
                                ? "bg-blue-100 border-blue-500"
                                : "hover:bg-gray-100"
                            }`}
                    >
                        <h2 className="font-semibold">{cafe.name}</h2>
                        <p className="text-sm text-gray-500">{cafe.wifi}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}