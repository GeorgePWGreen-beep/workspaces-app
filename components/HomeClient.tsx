"use client";

import { useCallback, useMemo, useState } from "react";
import FloatingDock, { type DockSheetMode } from "@/components/FloatingDock";
import FloatingSearch from "@/components/FloatingSearch";
import Map from "@/components/Map";
import Sidebar from "@/components/Sidebar";
import WorkspacesSheet from "@/components/WorkspacesSheet";
import type { Cafe } from "@/types/cafe";

export default function HomeClient({ cafes }: { cafes: Cafe[] }) {
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [sheetMode, setSheetMode] = useState<DockSheetMode | "cafe" | null>(null);
  const [search, setSearch] = useState("");
  const [greatWifiOnly, setGreatWifiOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [plentySocketsOnly, setPlentySocketsOnly] = useState(false);

  const filteredCafes = useMemo(() => {
    const normalizedSearch = search.toLowerCase();
    return cafes.filter((cafe) => {
      const matchesSearch = cafe.name.toLowerCase().includes(normalizedSearch);
      const matchesWifi = !greatWifiOnly || cafe.wifi === "Great WiFi";
      const matchesQuiet = !quietOnly || cafe.noise === "Quiet";
      const matchesSockets = !plentySocketsOnly || cafe.sockets === "Plenty";
      return matchesSearch && matchesWifi && matchesQuiet && matchesSockets;
    });
  }, [cafes, greatWifiOnly, plentySocketsOnly, quietOnly, search]);

  const openCafe = useCallback((cafe: Cafe) => {
    setSelectedCafe(cafe);
    setSheetMode("cafe");
  }, []);
  const openDockSheet = useCallback((mode: DockSheetMode) => {
    setSelectedCafe(null);
    setSheetMode(mode);
  }, []);
  const handleSheetDismissed = useCallback(() => {
    setSelectedCafe(null);
    setSheetMode(null);
  }, []);

  return (
    <div className="relative flex h-dvh w-full overflow-hidden">
      <div className="hidden h-full md:block">
        <Sidebar
          cafes={filteredCafes}
          selectedCafe={selectedCafe}
          setSelectedCafe={openCafe}
          search={search}
          onSearchChange={setSearch}
          greatWifiOnly={greatWifiOnly}
          onToggleGreatWifi={() => setGreatWifiOnly((current) => !current)}
          quietOnly={quietOnly}
          onToggleQuiet={() => setQuietOnly((current) => !current)}
          plentySocketsOnly={plentySocketsOnly}
          onTogglePlentySockets={() => setPlentySocketsOnly((current) => !current)}
        />
      </div>

      <div className="h-full min-w-0 flex-1">
        <Map
          allCafes={cafes}
          cafes={filteredCafes}
          selectedCafe={selectedCafe}
          setSelectedCafe={openCafe}
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
        onTogglePlentySockets={() => setPlentySocketsOnly((current) => !current)}
      />

      <WorkspacesSheet
        cafes={filteredCafes}
        mode={sheetMode}
        selectedCafe={selectedCafe}
        onSelectCafe={openCafe}
        onDismissed={handleSheetDismissed}
      />

      {sheetMode === null && <FloatingDock onSelect={openDockSheet} />}
    </div>
  );
}
