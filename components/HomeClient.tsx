"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrandLockup } from "./BrandMark";
import { X } from "lucide-react";
import { StudyPreferencesProvider, useStudyPreferences } from "./StudyPreferencesProvider";
import StudyPreferencesSheet from "./StudyPreferencesSheet";
import OnboardingFlow from "./onboarding/OnboardingFlow";
import { ONBOARDING_COMPLETE_KEY, ONBOARDING_STARTED_KEY, readOnboardingState } from "@/lib/onboarding";
import { SavedCafesProvider } from "./SavedCafesProvider";
import { cafeLinkKey } from "@/utils/cafeActions";
import CafeDetails from "@/components/CafeDetails";
import CityChooser from "@/components/CityChooser";
import { LocationProvider, useLocation } from "@/components/LocationProvider";
import { CafeTimeProvider, useCafeTime } from "@/components/CafeTimeProvider";
import FiltersSheet from "@/components/FiltersSheet";
import AccountSheet, { type AccountNotice } from "@/components/AccountSheet";
import { createDefaultFilters, type CafeFilters } from "@/types/filters";
import { filterCafes } from "@/utils/filters";
import { CITY_STORAGE_KEY, NEARBY_GUIDANCE_KEY, type City } from "@/lib/cities";
import FloatingDock, { type DockSheetMode } from "@/components/FloatingDock";
import FloatingSearch from "@/components/FloatingSearch";
import Map from "@/components/Map";
import Sidebar from "@/components/Sidebar";
import WorkspacesSheet from "@/components/WorkspacesSheet";
import type { Cafe } from "@/types/cafe";

export default function HomeClient({ cafes }: { cafes: Cafe[] }) {
  return <StudyPreferencesProvider cafes={cafes}><LocationProvider><CafeTimeProvider><SavedCafesProvider cafes={cafes}><HomeExperience cafes={cafes} /></SavedCafesProvider></CafeTimeProvider></LocationProvider></StudyPreferencesProvider>;
}

function HomeExperience({ cafes }: { cafes: Cafe[] }) {
  const preferences = useStudyPreferences();
  const [city, setCity] = useState<City | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [onboardingNeeded, setOnboardingNeeded] = useState<boolean | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [choosingCity, setChoosingCity] = useState(false);
  const pendingGuidance = useRef(true);
  const onboardingInProgress = useRef(false);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [sheetMode, setSheetMode] = useState<DockSheetMode | "cafe" | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<CafeFilters>(createDefaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersTrigger = useRef<HTMLElement | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountMode, setAccountMode] = useState<"welcome" | "signin" | "signup">("welcome");
  const [accountNotice, setAccountNotice] = useState<AccountNotice>(null);
  const accountTrigger = useRef<HTMLElement | null>(null);
  const { coordinates } = useLocation();
  const now = useCafeTime();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = readOnboardingState(window.localStorage);
        onboardingInProgress.current = window.localStorage.getItem(ONBOARDING_STARTED_KEY) === "true";
        setCity(saved.city);
        pendingGuidance.current = !saved.nearbySeen;
        if (saved.complete) {
          setOnboardingNeeded(false);
          window.localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
          if (saved.nearbySeen) window.localStorage.setItem(NEARBY_GUIDANCE_KEY, "seen");
        }
      } catch { /* Storage may be disabled; selection still works this visit. */ }
      setStorageReady(true);
      const url = new URL(window.location.href);
      const linkedCafe = cafes.find(cafe => cafeLinkKey(cafe) === url.searchParams.get("cafe"));
      if (linkedCafe) {
        setCity(linkedCafe.city); setSelectedCafe(linkedCafe); setSheetMode("cafe");
        setOnboardingNeeded(false); pendingGuidance.current = false;
      }
      const notice = url.searchParams.get("auth");
      if (notice === "confirmed" || notice === "confirmation-error") {
        setAccountNotice(notice); setAccountOpen(true);
        url.searchParams.delete("auth");
        window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [cafes]);

  useEffect(() => {
    if (!storageReady || onboardingNeeded !== null || preferences.status === "loading") return;
    const frame = window.requestAnimationFrame(() => {
      const returning = preferences.preferences !== null && !onboardingInProgress.current;
      setOnboardingNeeded(!returning);
      if (returning) {
        pendingGuidance.current = false;
        try {
          window.localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
          window.localStorage.setItem(NEARBY_GUIDANCE_KEY, "seen");
        } catch { /* Optional persistence. */ }
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [storageReady, onboardingNeeded, preferences.status, preferences.preferences]);

  useEffect(() => {
    if (!storageReady) return;
    const url = new URL(window.location.href);
    if (selectedCafe) url.searchParams.set("cafe", cafeLinkKey(selectedCafe));
    else url.searchParams.delete("cafe");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [selectedCafe, storageReady]);

  const handleMapReady = useCallback(() => setMapReady(true), []);
  useEffect(() => {
    if (!mapReady || onboardingNeeded || accountOpen || filtersOpen || choosingCity || preferences.editorOpen) return;
    const frame = window.requestAnimationFrame(() => {
      if (!pendingGuidance.current) return;
      pendingGuidance.current = false;
      // Desktop already displays Nearby in its persistent sidebar.
      if (window.matchMedia("(max-width: 767px)").matches) setSheetMode(current => current ?? "nearby");
      try { window.localStorage.setItem(NEARBY_GUIDANCE_KEY, "seen"); } catch { /* Once per visit if storage is disabled. */ }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [mapReady, onboardingNeeded, accountOpen, filtersOpen, choosingCity, preferences.editorOpen]);

  const finishOnboarding = () => {
    if (!city) return;
    preferences.closeEditor();
    setOnboardingNeeded(false);
    try {
      window.localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
      window.localStorage.removeItem(ONBOARDING_STARTED_KEY);
    } catch { /* Onboarding still completes for this visit. */ }
  };

  const chooseCity = (nextCity: City) => {
    setMapReady(false);
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
    setAccountMode("welcome"); setAccountNotice(null); setAccountOpen(true);
  };
  const closeAccount = () => {
    setAccountOpen(false); setAccountNotice(null);
    const trigger = accountTrigger.current;
    window.requestAnimationFrame(() => { if (trigger?.isConnected) trigger.focus({ preventScroll: true }); });
  };

  const openCafe = useCallback((cafe: Cafe) => {
    setCity(cafe.city);
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

  if (!storageReady || onboardingNeeded === null) return <main className="grid h-dvh place-items-center bg-[color:var(--hs-bg)]"><div className="flex flex-col items-center gap-4"><BrandLockup compact /><p role="status" className="text-sm text-[color:var(--hs-text-secondary)]">Getting Hot Seats ready...</p></div></main>;
  if (onboardingNeeded) return <OnboardingFlow city={city} onChooseCity={nextCity => {
    try { window.localStorage.setItem(ONBOARDING_STARTED_KEY, "true"); } catch { /* Optional persistence. */ }
    chooseCity(nextCity);
  }} onFinish={finishOnboarding} />;

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
          onOpenFriends={() => openDockSheet("friends")}
          onOpenSaved={() => openDockSheet("saved")}
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
        onFriendsAuth={mode => { accountTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setAccountMode(mode); setAccountNotice(null); setAccountOpen(true); }}
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
        <CafeDetails key={selectedCafe.id ?? selectedCafe.name} cafe={selectedCafe} onSignIn={() => { accountTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setAccountMode("signin"); setAccountNotice(null); setAccountOpen(true); }} />
      </aside>}

      {choosingCity && <CityChooser currentCity={city} onChoose={chooseCity} onCancel={() => setChoosingCity(false)} />}

      {filtersOpen && !choosingCity && <FiltersSheet filters={filters} onChange={changeFilters}
        onClear={() => changeFilters(createDefaultFilters())} onClose={closeFilters} resultCount={filteredCafes.length} />}

      {preferences.editorOpen && !choosingCity && !accountOpen && !filtersOpen && <StudyPreferencesSheet key={preferences.status} />}

      {accountOpen && !choosingCity && <AccountSheet initialMode={accountMode} onStudyPreferences={() => { closeAccount(); preferences.openEditor(); }} onClose={closeAccount} notice={accountNotice} />}

      {sheetMode === null && !choosingCity && <FloatingDock onSelect={openDockSheet} />}
    </div>
  );
}
