"use client";

import { useState } from "react";
import Map from "@/components/Map";
import Sidebar from "@/components/Sidebar";
import WorkspacesSheet from "@/components/WorkspacesSheet";
import FloatingSearch from "@/components/FloatingSearch";

import { Cafe } from "@/types/cafe";

export default function Home() {
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [search, setSearch] = useState("");
  const [greatWifiOnly, setGreatWifiOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [plentySocketsOnly, setPlentySocketsOnly] = useState(false);

  return (
    <div className="relative flex h-[100dvh] overflow-hidden">

      {/* Desktop Sidebar */}

      <div className="hidden md:block">
        <Sidebar
          selectedCafe={selectedCafe}
          setSelectedCafe={setSelectedCafe}
          search={search}
          onSearchChange={setSearch}
          greatWifiOnly={greatWifiOnly}
          onToggleGreatWifi={() => setGreatWifiOnly((current) => !current)}
          quietOnly={quietOnly}
          onToggleQuiet={() => setQuietOnly((current) => !current)}
          plentySocketsOnly={plentySocketsOnly}
          onTogglePlentySockets={() =>
            setPlentySocketsOnly((current) => !current)
          }
        />
      </div>

      {/* Map */}

      <div className="flex-1">
        <Map
          selectedCafe={selectedCafe}
          setSelectedCafe={setSelectedCafe}
        />
      </div>

      <FloatingSearch
        search={search}
        onSearchChange={setSearch}
        greatWifiOnly={greatWifiOnly}
        onToggleGreatWifi={() => setGreatWifiOnly((current) => !current)}
        quietOnly={quietOnly}
        onToggleQuiet={() => setQuietOnly((current) => !current)}
        plentySocketsOnly={plentySocketsOnly}
        onTogglePlentySockets={() =>
          setPlentySocketsOnly((current) => !current)
        }
      />

      <WorkspacesSheet
        selectedCafe={selectedCafe}
        setSelectedCafe={setSelectedCafe}
      />
    </div>
  );
}
