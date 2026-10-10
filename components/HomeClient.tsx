"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrandLockup } from "./BrandMark";
import { X } from "lucide-react";
import { StudyPreferencesProvider, useStudyPreferences } from "./StudyPreferencesProvider";
import StudyPreferencesSheet from "./StudyPreferencesSheet";
import { completeOnboarding, resetOnboarding, initialBrowseCity, readOnboardingState, ONBOARDING_STARTED_KEY } from "@/lib/onboarding";
import OnboardingFlow from "./onboarding/OnboardingFlow";
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
import { resultsViewportKey } from "@/utils/mapViewport";
import { CITY_STORAGE_KEY, type City } from "@/lib/cities";
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
  const onboardingInProgress = useRef(false);
  const [choosingCity, setChoosingCity] = useState(false);
  const [nearbyDismissRequest, setNearbyDismissRequest] = useState(0);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [sheetMode, setSheetMode] = useState<DockSheetMode | "cafe" | null>(null);
  const [search, setSearch] = useState("");
  const [selectionVersion, setSelectionVersion] = useState(0);
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
      let savedCity: City | null = null;
      const url = new URL(window.location.href);
      const reset = process.env.NODE_ENV === "development" && url.searchParams.get("intro") === "reset";
      onboardingInProgress.current = reset;
      try {
        if (reset) resetOnboarding(window.localStorage);
        const saved = readOnboardingState(window.localStorage);
        savedCity = saved.city;
        onboardingInProgress.current = reset || window.localStorage.getItem(ONBOARDING_STARTED_KEY) === "true";
        if (!reset && saved.complete) setOnboardingNeeded(false);
      } catch { /* Onboarding still works for this visit when storage is unavailable. */ }
      if (reset) {
        url.searchParams.delete("intro");
        window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
      }
      setCity(initialBrowseCity(savedCity, cafes.map(cafe => cafe.city)));
      setStorageReady(true);
      const linkedCafe = cafes.find(cafe => cafeLinkKey(cafe) === url.searchParams.get("cafe"));
      if (linkedCafe) {
        setCity(linkedCafe.city); setSelectedCafe(linkedCafe); setSheetMode("cafe");
        setOnboardingNeeded(false);
      }
      const notice = url.searchParams.get("auth");
      if (notice === "confirmed" || notice === "confirmation-error") {
        setOnboardingNeeded(false);
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
      try {
        if (returning) completeOnboarding(window.localStorage);
        else window.localStorage.setItem(ONBOARDING_STARTED_KEY, "true");
      } catch { /* Optional persistence. */ }
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

  const finishOnboarding = () => {
    preferences.closeEditor();
    setOnboardingNeeded(false);
    try {
      completeOnboarding(window.localStorage);
      if (city) window.localStorage.setItem(CITY_STORAGE_KEY, city);
    } catch { /* Onboarding still completes for this visit. */ }
  };

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

  const changeSearch = (next: string) => {
    setSearch(next);
    setSelectedCafe(null);
    setSheetMode(current => current === "cafe" ? "nearby" : current);
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
    setSelectionVersion(version => version + 1);
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

  if (!storageReady || !city || onboardingNeeded === null) return <main className="grid h-dvh place-items-center bg-[color:var(--hs-bg)]"><div className="flex flex-col items-center gap-4"><BrandLockup compact /><p role="status" className="text-sm text-[color:var(--hs-text-secondary)]">Getting Hot Seats ready...</p></div></main>;

  if (onboardingNeeded) return <OnboardingFlow city={city} onFinish={finishOnboarding} />;

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
          onSearchChange={changeSearch}
          filters={filters}
          onChange={changeFilters}
          onOpenFilters={openFilters}
          onOpenAccount={openAccount}
          onOpenFriends={() => openDockSheet("friends")}
          onOpenSaved={() => openDockSheet("saved")}
        />
      </div>

      <div className="h-full min-w-0 flex-1" onPointerDownCapture={event => {
        // Do not intercept the gesture or close Nearby when selecting a pin.
        if (sheetMode === "nearby" && event.target instanceof Element && event.target.closest(".mapboxgl-canvas")) {
          setNearbyDismissRequest(request => request + 1);
        }
      }}>
        <Map
          key={city}
          city={city}
          allCafes={cityCafes}
          cafes={filteredCafes}
          selectedCafe={selectedCafe}
          setSelectedCafe={openCafe}
          viewportKey={resultsViewportKey(search, filters, selectionVersion)}
          sheetOpen={sheetMode !== null}
        />
      </div>

      <FloatingSearch
        search={search}
        onSearchChange={changeSearch}
        cafes={filteredCafes}
        onSelectCafe={openCafe}
        filters={filters}
        onChange={changeFilters}
        onOpenFilters={openFilters}
        onOpenAccount={openAccount}
      />

      {!choosingCity && <WorkspacesSheet
        dismissRequest={nearbyDismissRequest}
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
