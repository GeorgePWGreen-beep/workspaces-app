"use client";

import { Armchair, Check, Clock3, Clock9, Coffee, Hourglass, Maximize2, PlugZap, Users, AudioLines, VolumeX, Wifi, type LucideIcon } from "lucide-react";
import styles from "../StudyPreferences.module.css";
import type { StudyPreferences } from "@/types/studyPreferences";
import { togglePriority } from "@/lib/onboarding";

export type PreferenceDraft = {
  atmosphere_preference: StudyPreferences["atmosphere_preference"] | null;
  session_length: StudyPreferences["session_length"] | null;
  priorities: StudyPreferences["priorities"];
};
export const preferenceAction = "flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[color:var(--hs-green)] px-5 py-4 text-[15px] font-semibold text-white shadow-[0_3px_8px_rgba(37,93,47,0.12)] transition-colors hover:bg-[color:var(--hs-green-deep)] active:bg-[color:var(--hs-green-deep)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--hs-green)] disabled:cursor-default disabled:opacity-40";
export const preferenceHeadings = ["What atmosphere helps you focus?", "How long will you stay?", "What matters most?"];
const atmospheres = [
  { value: "quiet", label: "Quiet", description: "Calm, with minimal background noise", icon: VolumeX },
  { value: "balanced", label: "Balanced", description: "A moderate hum of activity", icon: AudioLines },
  { value: "lively", label: "Lively", description: "An energetic, social atmosphere", icon: Users },
] as const;
const sessions = [
  { value: "short", label: "Under 1 hour", description: "Quick session", icon: Clock3 },
  { value: "medium", label: "1–2 hours", description: "Typical study session", icon: Clock9 },
  { value: "long", label: "2+ hours", description: "Longer focus session", icon: Hourglass },
] as const;
const priorities = [
  { value: "wifi", label: "Wi-Fi", icon: Wifi },
  { value: "sockets", label: "Sockets", icon: PlugZap },
  { value: "seating", label: "Comfort", icon: Armchair },
  { value: "coffee", label: "Coffee", icon: Coffee },
  { value: "space", label: "Space", icon: Maximize2 },
] as const;

function Choice({ label, description, icon: Icon, selected, disabled, multiple, name, onChange }: {
  label: string; description?: string; icon: LucideIcon; selected: boolean; disabled?: boolean;
  multiple?: boolean; name: string; onChange: () => void;
}) {
  return <label className={`${styles.option} ${multiple ? styles.priority : ""} ${selected ? styles.selected : ""} ${disabled ? styles.disabled : ""}`}>
    <input className="sr-only" type={multiple ? "checkbox" : "radio"} name={name} checked={selected} disabled={disabled} onChange={onChange} />
    <span aria-hidden="true" className={styles.iconTile}><Icon strokeWidth={1.65} /></span>
    <span className={styles.label}><span>{label}</span>{description && <span className={styles.description}>{description}</span>}</span>
    <span aria-hidden="true" className={styles.control}>{selected && <Check className="h-3 w-3" strokeWidth={2.5} />}</span>
  </label>;
}

export default function PreferenceFields({ step, draft, onChange, busy = false }: {
  step: number; draft: PreferenceDraft; onChange: (draft: PreferenceDraft) => void; busy?: boolean;
}) {
  return <fieldset className={`${styles.fields} ${step === 2 ? styles.priorityGrid : ""}`}>
    <legend className="sr-only">{preferenceHeadings[step]}</legend>
    {step === 0 && atmospheres.map(option => <Choice key={option.value} {...option} name="atmosphere" selected={draft.atmosphere_preference === option.value} disabled={busy} onChange={() => onChange({ ...draft, atmosphere_preference: option.value })} />)}
    {step === 1 && sessions.map(option => <Choice key={option.value} {...option} name="session" selected={draft.session_length === option.value} disabled={busy} onChange={() => onChange({ ...draft, session_length: option.value })} />)}
    {step === 2 && priorities.map(option => <Choice key={option.value} {...option} name="priorities" multiple selected={draft.priorities.includes(option.value)} disabled={busy || (draft.priorities.length === 3 && !draft.priorities.includes(option.value))} onChange={() => onChange({ ...draft, priorities: togglePriority(draft.priorities, option.value) })} />)}
  </fieldset>;
}
