"use client";

import { useState } from "react";
import Map from "@/components/Map";
import Sidebar from "@/components/Sidebar";
import BottomSheet from "@/components/BottomSheet";
import FloatingSearch from "@/components/FloatingSearch";

import { Cafe } from "@/types/cafe";


export default function Home() {
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);

  return (
  <div className="flex h-screen relative">
    {/* Desktop sidebar */}
    <div className="hidden md:block">
      <Sidebar
        selectedCafe={selectedCafe}
        setSelectedCafe={setSelectedCafe}
      />
    </div>

    {/* Map */}
    <div className="flex-1">
      <Map
    selectedCafe={selectedCafe}
    setSelectedCafe={setSelectedCafe}
/>
    </div>

<FloatingSearch />

    <BottomSheet selectedCafe={selectedCafe} />

  </div>
);
}
