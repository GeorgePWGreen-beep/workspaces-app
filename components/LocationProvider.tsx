"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
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
    // walking-times action handles browsers without Permissions API too.
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
  if (status === "denied") return <p className="mt-2 text-xs text-[color:var(--hs-text-secondary)]">Walking times off · location access denied</p>;

  const label = status === "loading"
    ? "Finding your location…"
    : status === "unavailable"
      ? "Retry walking times"
      : "Enable walking times";

  return (
    <button
      type="button"
      onClick={requestLocation}
      disabled={status === "loading"}
      className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-full border border-[color:var(--hs-border)] bg-[color:var(--hs-green-soft)] px-3.5 py-2 text-sm font-semibold text-[color:var(--hs-green-deep)] shadow-[0_2px_8px_rgba(20,25,21,0.05)] transition-[transform,background-color,box-shadow] duration-150 hover:bg-white hover:shadow-[0_3px_10px_rgba(20,25,21,0.08)] active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <MapPin aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
      <span>{label}</span>
    </button>
  );
}
