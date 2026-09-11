"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Coordinates } from "@/utils/walking";

type LocationStatus = "prompt" | "loading" | "granted" | "denied" | "unavailable";
const LocationContext = createContext<{
  coordinates: Coordinates | null;
  status: LocationStatus;
  requestLocation: () => void;
}>({ coordinates: null, status: "unavailable", requestLocation: () => undefined });

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<LocationStatus>("prompt");
  const watch = useRef<number | null>(null);
  const startWatch = useCallback(() => {
    if (!navigator.geolocation) { setStatus("unavailable"); return; }
    if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
    setStatus("loading");
    watch.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        if (coords.accuracy > 1000) { setCoordinates(null); setStatus("unavailable"); return; }
        setCoordinates({ latitude: coords.latitude, longitude: coords.longitude });
        setStatus("granted");
      },
      (error) => {
        setCoordinates(null);
        setStatus(error.code === 1 ? "denied" : "unavailable");
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    );
  }, []);

  useEffect(() => {
    let disposed = false;
    let permission: PermissionStatus | undefined;
    const syncPermission = () => {
      if (disposed || !permission) return;
      if (permission.state === "granted") startWatch();
      else {
        if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
        watch.current = null;
        setCoordinates(null);
        setStatus(permission.state === "denied" ? "denied" : "prompt");
      }
    };
    // Never trigger a permission prompt on first visit. A small explicit
    // walking-estimates action handles browsers without Permissions API too.
    navigator.permissions?.query({ name: "geolocation" }).then((result) => {
      if (disposed) return;
      permission = result;
      permission.addEventListener("change", syncPermission);
      syncPermission();
    }).catch(() => undefined);
    return () => {
      disposed = true;
      permission?.removeEventListener("change", syncPermission);
      if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
    };
  }, [startWatch]);

  return <LocationContext.Provider value={{ coordinates, status, requestLocation: startWatch }}>{children}</LocationContext.Provider>;
}

export function useLocation() { return useContext(LocationContext); }

export function WalkingLocationAction() {
  const { status, requestLocation } = useLocation();
  if (status === "granted") return null;
  if (status === "denied") return <p className="mt-2 text-xs text-[color:var(--hs-text-secondary)]">Walking estimates off · location access denied</p>;
  return (
    <button type="button" onClick={requestLocation} disabled={status === "loading"}
      className="mt-1 min-h-11 text-left text-sm font-medium text-[color:var(--hs-green-deep)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2">
      {status === "loading" ? "Finding your location…" : status === "unavailable" ? "Retry walking estimates" : "Enable walking estimates"}
    </button>
  );
}
