"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { completeFeatureIntroduction, FEATURE_INTRODUCTION_KEYS, type FeatureIntroduction, type FeatureIntroductionState } from "@/lib/onboarding";

const completedByDefault: FeatureIntroductionState = { studyScore: true, match: true };

/** Home owns one progression state for both responsive copies of cafe details. */
export function useFeatureIntroductionsState() {
  const [completed, setCompleted] = useState(completedByDefault);
  const [active, setActive] = useState<{ feature: FeatureIntroduction; owner: string } | null>(null);
  const completedRef = useRef(completedByDefault);
  const activeRef = useRef<typeof active>(null);
  const initialize = useCallback((next: FeatureIntroductionState) => {
    completedRef.current = next;
    setCompleted(next);
  }, []);
  const complete = useCallback((feature: FeatureIntroduction) => {
    if (completedRef.current[feature]) return;
    completedRef.current = { ...completedRef.current, [feature]: true };
    setCompleted(completedRef.current);
    try { completeFeatureIntroduction(window.localStorage, feature); } catch { /* Once per session if storage is blocked. */ }
  }, []);
  const claim = useCallback((feature: FeatureIntroduction, owner: string) => {
    if (completedRef.current[feature] || activeRef.current) return;
    const next = { feature, owner };
    activeRef.current = next;
    complete(feature);
    setActive(next);
  }, [complete]);
  const dismiss = useCallback((owner: string) => {
    if (activeRef.current?.owner !== owner) return;
    activeRef.current = null;
    setActive(null);
  }, []);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      const feature = (Object.keys(FEATURE_INTRODUCTION_KEYS) as FeatureIntroduction[])
        .find(key => FEATURE_INTRODUCTION_KEYS[key] === event.key);
      if (!feature || event.newValue !== "seen") return;
      completedRef.current = { ...completedRef.current, [feature]: true };
      setCompleted(completedRef.current);
      if (activeRef.current?.feature === feature) dismiss(activeRef.current.owner);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [dismiss]);
  return { completed, active, initialize, claim, complete, dismiss };
}

export const FeatureIntroductionsContext = createContext<(ReturnType<typeof useFeatureIntroductionsState> & { suspended: boolean }) | null>(null);

/** Only a visible, settled encounter counts. Hidden desktop/mobile copies never
 * consume a cue, and at most one contextual explanation can be open at a time. */
export function useFeatureIntroduction(feature: FeatureIntroduction) {
  const context = useContext(FeatureIntroductionsContext);
  const owner = useId();
  const ref = useRef<HTMLDivElement>(null);
  const claim = context?.claim;
  const complete = context?.complete;
  const dismiss = context?.dismiss;
  // Both sections can fit on desktop. Give Study Score the first encounter,
  // rather than letting observer callback ordering choose the introduction.
  const ready = feature !== "match" || context?.completed.studyScore;
  const eligible = !!context && !!ready && !context.suspended && !context.completed[feature] && !context.active;
  const visible = context?.active?.owner === owner && !context.suspended;
  useEffect(() => {
    const element = ref.current;
    if (!eligible || !element || !claim) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      clearTimeout(timer);
      if (!entry.isIntersecting || entry.intersectionRatio < 0.65) return;
      timer = setTimeout(() => {
        if (getComputedStyle(element).visibility === "visible" && element.getBoundingClientRect().width > 0) claim(feature, owner);
      }, 450);
    }, { threshold: 0.65 });
    observer.observe(element);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [eligible, claim, feature, owner]);
  useEffect(() => () => dismiss?.(owner), [dismiss, owner]);
  // An explicit skip/action completes this feature even while another cue is open.
  return { ref, visible, pending: eligible, dismiss: () => { complete?.(feature); dismiss?.(owner); } };
}
