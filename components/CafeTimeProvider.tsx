"use client";

import { createContext, useContext, useEffect, useState } from "react";

const CafeTimeContext = createContext<Date | null>(null);

/** One clock keeps Open Now, pin treatment, cards and details in agreement. */
export function CafeTimeProvider({ children }: { children: React.ReactNode }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const update = () => setNow(new Date());
    const initial = window.setTimeout(update, 0);
    const timer = window.setInterval(update, 30_000);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return <CafeTimeContext.Provider value={now}>{children}</CafeTimeContext.Provider>;
}

export function useCafeTime() { return useContext(CafeTimeContext); }
