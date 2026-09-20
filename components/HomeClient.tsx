"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { StudyPreferencesProvider, useStudyPreferences } from "./StudyPreferencesProvider";
import StudyPreferencesSheet from "./StudyPreferencesSheet";
import CafeDetails from "@/components/CafeDetails";
import CityChooser from "@/components/CityChooser";
import { LocationProvider, useLocation } from "@/components/LocationProvider";
import { CafeTimeProvider, useCafeTime } from "@/components/CafeTimeProvider";
import FiltersSheet from "@/components/FiltersSheet";
import AccountSheet, { type AccountNotice } from "@/components/AccountSheet";
import { createDefaultFilters, type CafeFilters } from "@/types/filters";
import { filterCafes } from "@/utils/filters";
import { CITY_STORAGE_KEY, NEARBY_GUIDANCE_KEY, isCity, type City } from "@/lib/cities";
import FloatingDock, { type DockSheetMode } from "@/components/FloatingDock";
import FloatingSearch from "@/components/FloatingSearch";
import Map from "@/components/Map";
import Sidebar from "@/components/Sidebar";
import WorkspacesSheet from "@/components/WorkspacesSheet";
import type { Cafe } from "@/types/cafe";

export default function HomeClient({ cafes }: { cafes: Cafe[] }) {
  return <StudyPreferencesProvider cafes={cafes}><LocationProvider><CafeTimeProvider><HomeExperience cafes={cafes} /></CafeTimeProvider></LocationProvider></StudyPreferencesProvider>;
}

function HomeExperience({ cafes }: { cafes: Cafe[] }) {
  const preferences = useStudyPreferences();
  const [city, setCity] = useState<City | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [choosingCity, setChoosingCity] = useState(false);
  const pendingGuidance = useRef(true);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [sheetMode, setSheetMode] = useState<DockSheetMode | "cafe" | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<CafeFilters>(createDefaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersTrigger = useRef<HTMLElement | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountNotice, setAccountNotice] = useState<AccountNotice>(null);
  const accountTrigger = useRef<HTMLElement | null>(null);
  const { coordinates } = useLocation();
  const now = useCafeTime();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const savedCity = window.localStorage.getItem(CITY_STORAGE_KEY);
        if (isCity(savedCity)) setCity(savedCity);
        pendingGuidance.current = window.localStorage.getItem(NEARBY_GUIDANCE_KEY) !== "seen";
      } catch { /* Storage may be disabled; selection still works this visit. */ }
      setStorageReady(true);
      const url = new URL(window.location.href);
      const notice = url.searchParams.get("auth");
      if (notice === "confirmed" || notice === "confirmation-error") {
        setAccountNotice(notice); setAccountOpen(true);
        url.searchParams.delete("auth");
        window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const handleMapReady = useCallback(() => {
    if (!pendingGuidance.current || !window.matchMedia("(max-width: 767px)").matches) return;
    pendingGuidance.current = false;
    setSheetMode((current) => current ?? "nearby");
    try { window.localStorage.setItem(NEARBY_GUIDANCE_KEY, "seen"); } catch { /* Optional persistence. */ }
  }, []);

  const chooseCity = (nextCity: City) => {
    setCity(nextCity);
    setChoosingCity(false);
    setSelectedCafe(null);
    setSheetMode(null);
    setSearch("");
    try { window.localStorage.setItem(CITY_STORAGE_KEY, nextCity); } catch { /* Optional persistence. */ }
  };
  const openCityChooser = () => {
    setSelectedCafe(null);
    setSheetMode(null);
    setFiltersOpen(false);
    setChoosingCity(true);
  };
  const cityCafes = useMemo(() => cafes.filter((cafe) => cafe.city === city), [cafes, city]);

  const filteredCafes = useMemo(() => city ? filterCafes(cafes, filters, { city, search, coordinates, now }) : [],
    [cafes, city, filters, search, coordinates, now]);

  const changeFilters = (next: CafeFilters) => {
    setFilters(next);
    setSelectedCafe(null);
    setSheetMode((current) => current === "cafe" ? "nearby" : current);
  };

  const openFilters = () => {
    // Capture before Nearby is hidden; hiding it can blur its Filters button.
    filtersTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setFiltersOpen(true);
  };
  const closeFilters = () => {
    setFiltersOpen(false);
    const trigger = filtersTrigger.current;
    window.requestAnimationFrame(() => {
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    });
  };

  const openAccount = () => {
    accountTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setAccountNotice(null); setAccountOpen(true);
  };
  const closeAccount = () => {
    setAccountOpen(false); setAccountNotice(null);
    const trigger = accountTrigger.current;
    window.requestAnimationFrame(() => { if (trigger?.isConnected) trigger.focus({ preventScroll: true }); });
  };

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

  if (!city) return (
    <main className="min-h-dvh bg-[color:var(--hs-bg)]">
      {storageReady ? <CityChooser currentCity={null} onChoose={chooseCity} onCancel={() => undefined} /> : <p className="sr-only" role="status">Loading your city</p>}
    </main>
  );

  return (
    <div className="relative flex h-dvh w-full overflow-hidden">
      <div className="hidden h-full md:block">
        <Sidebar
          city={city}
          onChangeCity={openCityChooser}
          cafes={filteredCafes}
          selectedCafe={selectedCafe}
          setSelectedCafe={openCafe}
          search={search}
          onSearchChange={setSearch}
          filters={filters}
          onChange={changeFilters}
          onOpenFilters={openFilters}
          onOpenAccount={openAccount}
        />
      </div>

      <div className="h-full min-w-0 flex-1">
        <Map
          key={city}
          city={city}
          onReady={handleMapReady}
          allCafes={cityCafes}
          cafes={filteredCafes}
          selectedCafe={selectedCafe}
          setSelectedCafe={openCafe}
        />
      </div>

      <FloatingSearch
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onChange={changeFilters}
        onOpenFilters={openFilters}
        onOpenAccount={openAccount}
      />

      {!choosingCity && <WorkspacesSheet
        city={city}
        onChangeCity={openCityChooser}
        onOpenFilters={openFilters}
        isObscured={filtersOpen || accountOpen || preferences.editorOpen}
        cafes={filteredCafes}
        mode={sheetMode}
        selectedCafe={selectedCafe}
        onSelectCafe={openCafe}
        onDismissed={handleSheetDismissed}
      />}

      {selectedCafe && !choosingCity && <aside aria-label={`${selectedCafe.name} details`} className="relative hidden h-full w-[min(400px,40vw)] shrink-0 overflow-y-auto border-l border-[color:var(--hs-border)] bg-[color:var(--hs-bg)] md:block">
        <button type="button" aria-label="Close cafe details" onClick={handleSheetDismissed} className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/95 shadow-sm"><X aria-hidden="true" className="h-5 w-5" /></button>
        <CafeDetails key={selectedCafe.name} cafe={selectedCafe} />
      </aside>}

      {choosingCity && <CityChooser currentCity={city} onChoose={chooseCity} onCancel={() => setChoosingCity(false)} />}

      {filtersOpen && !choosingCity && <FiltersSheet filters={filters} onChange={changeFilters}
        onClear={() => changeFilters(createDefaultFilters())} onClose={closeFilters} resultCount={filteredCafes.length} />}

      {preferences.editorOpen && !choosingCity && !accountOpen && !filtersOpen && <StudyPreferencesSheet key={preferences.status} />}

      {accountOpen && !choosingCity && <AccountSheet onStudyPreferences={() => { closeAccount(); preferences.openEditor(); }} onClose={closeAccount} notice={accountNotice} />}

      {sheetMode === null && !choosingCity && <FloatingDock onSelect={openDockSheet} />}
    </div>
  );
}
