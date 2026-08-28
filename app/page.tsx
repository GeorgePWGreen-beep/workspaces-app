"use client";

import { useCallback, useMemo, useState } from "react";
import Map from "@/components/Map";
import Sidebar from "@/components/Sidebar";
import WorkspacesSheet from "@/components/WorkspacesSheet";
import FloatingSearch from "@/components/FloatingSearch";
import FloatingDock, {
  type DockSheetMode,
} from "@/components/FloatingDock";

import { Cafe } from "@/types/cafe";
import { cafes } from "@/data/cafes";

export default function Home() {
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [sheetMode, setSheetMode] = useState<
    DockSheetMode | "cafe" | null
  >(null);
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
  }, [greatWifiOnly, plentySocketsOnly, quietOnly, search]);

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
    <div className="relative flex h-[100dvh] overflow-hidden">

      {/* Desktop Sidebar */}

      <div className="hidden md:block">
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
          onTogglePlentySockets={() =>
            setPlentySocketsOnly((current) => !current)
          }
        />
      </div>

      {/* Map */}

      <div className="flex-1">
        <Map
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
        onTogglePlentySockets={() =>
          setPlentySocketsOnly((current) => !current)
        }
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
