"use client";

import { useState } from "react";

import Map from "@/components/Map";
import Sidebar from "@/components/Sidebar";

import { Cafe } from "@/types/cafe";

export default function Home() {
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);

  return (
    <div className="flex h-screen">
      <Sidebar
        selectedCafe={selectedCafe}
        setSelectedCafe={setSelectedCafe}
      />

      <div className="flex-1">
        <Map selectedCafe={selectedCafe} />
      </div>
    </div>
  );
}