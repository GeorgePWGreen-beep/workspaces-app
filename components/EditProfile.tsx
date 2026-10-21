"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { Check, LoaderCircle } from "lucide-react";
import type { Profile } from "@/types/profile";
import { AVATAR_APPEARANCES, AVATAR_COLOURS, AVATAR_HAIRSTYLES, AVATAR_HAIR_COLOURS, AVATAR_PRESENTATIONS, AVATAR_SKIN_TONES, DEFAULT_PORTRAIT, DISPLAY_NAME_MAX_LENGTH, normalizeDisplayName, parseAvatarPreset, parsePortraitAvatar, portraitAvatarSource, validateProfileEdits, type PortraitAvatarConfig, type ProfileFieldErrors } from "@/utils/profile";
import { useAuth } from "./AuthProvider";
import ProfileAvatar from "./ProfileAvatar";

const avatarTabs = [
  { id: "appearance", label: "Appearance" },
  { id: "hair", label: "Hair" },
  { id: "skin", label: "Skin tone" },
  { id: "colour", label: "Background" },
] as const;

export default function EditProfile({ profile, onCancel, onSaved, actionClassName }: {
  profile: Profile; onCancel: () => void; onSaved: () => void; actionClassName: string;
}) {
  const auth = useAuth();
  const id = useId();
  const nameInput = useRef<HTMLInputElement>(null);
  const avatarInput = useRef<HTMLFieldSetElement>(null);
  const [displayName, setDisplayName] = useState(profile.display_name || profile.username);
  const [avatar, setAvatar] = useState(profile.avatar_url);
  const [errors, setErrors] = useState<ProfileFieldErrors>({});
  const [message, setMessage] = useState("");
  const [avatarTab, setAvatarTab] = useState<typeof avatarTabs[number]["id"]>("appearance");
  const portrait = parsePortraitAvatar(avatar);
  const previewPortrait = portrait ?? { ...DEFAULT_PORTRAIT, colour: parseAvatarPreset(avatar)?.colour ?? DEFAULT_PORTRAIT.colour };
  const previewName = normalizeDisplayName(displayName) || profile.username;
  const length = Array.from(normalizeDisplayName(displayName)).length;

  function selectAvatar(source: string | null) {
    setAvatar(source); setErrors(current => ({ ...current, avatar: undefined })); setMessage("");
  }
  function customizePortrait(change: Partial<PortraitAvatarConfig>) {
    selectAvatar(portraitAvatarSource({ ...previewPortrait, ...change }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (auth.busy) return;
    // Omit an unchanged avatar, especially legacy photo URLs. New choices can
    // only be a catalog preset or null; the user never supplies an external URL.
    const edits = { displayName, ...(avatar === profile.avatar_url ? {} : { avatar }) };
    const validation = validateProfileEdits(edits);
    setErrors(validation); setMessage("");
    if (validation.displayName) { nameInput.current?.focus(); return; }
    if (validation.avatar) { avatarInput.current?.focus(); return; }
    const result = await auth.updateProfile(edits);
    if (result.ok) onSaved();
    else if (result.field) {
      setErrors({ [result.field]: result.message });
      (result.field === "displayName" ? nameInput : avatarInput).current?.focus();
    } else setMessage(result.message);
  }

  return <form onSubmit={submit} noValidate aria-busy={auth.busy} className="mt-5 space-y-5">
    <div aria-label="Profile preview" className="flex items-center gap-4 rounded-[var(--hs-radius-card)] border border-[color:var(--hs-border)] bg-white p-4">
      <ProfileAvatar name={previewName} source={avatar} size="preview" />
      <div className="min-w-0"><p className="break-words text-xl font-semibold leading-tight tracking-[-0.025em]">{previewName}</p><p className="mt-1 break-all text-sm text-[color:var(--hs-text-secondary)]">@{profile.username}</p><p className="mt-1 text-xs text-[color:var(--hs-text-tertiary)]">Your username stays the same.</p></div>
    </div>
    <div>
      <label htmlFor={`${id}-name`} className="mb-2 block text-sm font-semibold">Display name</label>
      <input ref={nameInput} id={`${id}-name`} name="displayName" value={displayName} autoComplete="nickname" required disabled={auth.busy}
        aria-invalid={Boolean(errors.displayName)} aria-describedby={`${id}-name-hint${errors.displayName ? ` ${id}-name-error` : ""}`}
        onChange={event => { setDisplayName(event.target.value); setErrors(current => ({ ...current, displayName: undefined })); setMessage(""); }}
        className={`h-12 w-full scroll-my-5 rounded-2xl border bg-white px-4 text-base outline-none focus:ring-2 disabled:opacity-60 ${errors.displayName ? "border-red-700 focus:ring-red-100" : "border-[color:var(--hs-border)] focus:border-[color:var(--hs-green)] focus:ring-[color:var(--hs-green-soft)]"}`} />
      <p id={`${id}-name-hint`} className={`mt-1.5 flex justify-between gap-3 text-xs leading-5 ${length > DISPLAY_NAME_MAX_LENGTH ? "text-red-800" : "text-[color:var(--hs-text-secondary)]"}`}><span>How you appear to others.</span><span className="shrink-0 tabular-nums">{length}/{DISPLAY_NAME_MAX_LENGTH}</span></p>
      {errors.displayName && <p id={`${id}-name-error`} role="alert" className="mt-1 text-sm text-red-800">{errors.displayName}</p>}
    </div>
    <fieldset ref={avatarInput} disabled={auth.busy} tabIndex={-1} aria-describedby={errors.avatar ? `${id}-avatar-error` : undefined} className="min-w-0 disabled:opacity-60">
      <legend className="mb-1 flex w-full items-center justify-between gap-2 text-sm font-semibold"><span>Personal avatar</span><button type="button" disabled={auth.busy} aria-label="Keep current avatar" aria-pressed={avatar === profile.avatar_url} onClick={() => selectAvatar(profile.avatar_url)} className="min-h-11 rounded-xl px-2 text-xs font-medium text-[color:var(--hs-green-deep)] focus-visible:outline-2">Keep current</button></legend>
      <div role="tablist" aria-label="Avatar customisation" className="grid grid-cols-4 gap-1 rounded-2xl bg-[color:var(--hs-green-soft)] p-1">
        {avatarTabs.map((tab, index) => <button key={tab.id} type="button" role="tab" id={`${id}-tab-${tab.id}`} aria-selected={avatarTab === tab.id} aria-controls={`${id}-panel-${tab.id}`} tabIndex={avatarTab === tab.id ? 0 : -1}
          onClick={() => setAvatarTab(tab.id)} onKeyDown={event => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
            event.preventDefault();
            const next = event.key === "Home" ? 0 : event.key === "End" ? avatarTabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + avatarTabs.length) % avatarTabs.length;
            setAvatarTab(avatarTabs[next].id);
            document.getElementById(`${id}-tab-${avatarTabs[next].id}`)?.focus();
          }} className={`min-h-11 rounded-xl px-1 text-[11px] font-semibold focus-visible:outline-2 focus-visible:outline-[color:var(--hs-green)] ${avatarTab === tab.id ? "bg-white text-[color:var(--hs-green-deep)] shadow-sm" : "text-[color:var(--hs-text-secondary)]"}`}>{tab.label}</button>)}
      </div>
      {avatarTabs.map(tab => <div key={tab.id} role="tabpanel" id={`${id}-panel-${tab.id}`} aria-labelledby={`${id}-tab-${tab.id}`} hidden={avatarTab !== tab.id} className="min-h-[122px] pt-3">
        {tab.id === "appearance" && <fieldset className="mb-3 min-w-0">
          <legend className="mb-2 text-xs text-[color:var(--hs-text-secondary)]">Avatar presentation</legend>
          <div className="grid grid-cols-2 gap-2">
            {AVATAR_PRESENTATIONS.map(option => <label key={option.id} className="cursor-pointer">
              <input type="radio" name={`${id}-presentation`} value={option.id} checked={portrait?.presentation === option.id} onChange={() => customizePortrait({ presentation: option.id })} className="peer sr-only" />
              <span className="flex min-h-11 items-center justify-center rounded-xl border border-[color:var(--hs-border)] text-sm font-medium peer-checked:border-[color:var(--hs-green)] peer-checked:bg-[color:var(--hs-green-soft)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--hs-green)]">{option.label}</span>
            </label>)}
          </div>
        </fieldset>}
        <fieldset className="min-w-0">
          <legend className="mb-2 text-xs text-[color:var(--hs-text-secondary)]">{tab.id === "appearance" ? "Choose a face shape" : tab.id === "hair" ? "Choose a hairstyle" : tab.id === "skin" ? "Choose a skin tone" : "Choose a background"}</legend>
          {tab.id === "appearance" || tab.id === "hair" ? <div className={`grid gap-2 ${tab.id === "appearance" ? "grid-cols-3" : "grid-cols-4"}`}>
            {(tab.id === "appearance" ? AVATAR_APPEARANCES : AVATAR_HAIRSTYLES).map(option => <label key={option.id} className="relative cursor-pointer">
              <input type="radio" name={`${id}-${tab.id}`} value={option.id} checked={portrait?.[tab.id] === option.id} onChange={() => customizePortrait({ [tab.id]: option.id })} className="peer sr-only" />
              <span className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border border-[color:var(--hs-border)] bg-white p-2 peer-checked:border-[color:var(--hs-green)] peer-checked:bg-[color:var(--hs-green-soft)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--hs-green)]">
                <ProfileAvatar name={previewName} source={portraitAvatarSource({ ...previewPortrait, [tab.id]: option.id })} />
                <span className="text-xs font-medium">{option.label}</span>
              </span>
            </label>)}
          </div> : <div className="flex justify-between gap-2 px-1 pt-1">
            {(tab.id === "skin" ? AVATAR_SKIN_TONES : AVATAR_COLOURS).map(option => <label key={option.id} className="cursor-pointer">
              <input type="radio" name={`${id}-${tab.id}`} value={option.id} aria-label={option.label} checked={portrait?.[tab.id] === option.id} onChange={() => customizePortrait({ [tab.id]: option.id })} className="peer sr-only" />
              <span style={{ backgroundColor: "base" in option ? option.base : option.background, color: "feature" in option ? option.feature : option.foreground }} className="grid h-11 w-11 place-items-center rounded-full border border-black/5 peer-checked:ring-2 peer-checked:ring-[color:var(--hs-green)] peer-checked:ring-offset-2 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-[color:var(--hs-green)]">{portrait?.[tab.id] === option.id && <Check aria-hidden="true" className="h-5 w-5" />}</span>
            </label>)}
          </div>}
        </fieldset>
        {tab.id === "hair" && <fieldset className="mt-3 min-w-0">
          <legend className="mb-2 text-xs text-[color:var(--hs-text-secondary)]">Hair colour</legend>
          <div className="grid grid-cols-4 gap-2">
            {AVATAR_HAIR_COLOURS.map(option => <label key={option.id} className="cursor-pointer">
              <input type="radio" name={`${id}-hairColour`} value={option.id} checked={portrait?.hairColour === option.id} onChange={() => customizePortrait({ hairColour: option.id })} className="peer sr-only" />
              <span className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border border-[color:var(--hs-border)] p-1 peer-checked:border-[color:var(--hs-green)] peer-checked:bg-[color:var(--hs-green-soft)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--hs-green)]">
                <span aria-hidden="true" style={{ backgroundColor: option.fill }} className="h-6 w-6 rounded-full border border-black/5" />
                <span className="text-xs font-medium">{option.label}</span>
              </span>
            </label>)}
          </div>
        </fieldset>}
      </div>)}
      {errors.avatar && <p id={`${id}-avatar-error`} role="alert" className="mt-2 text-sm text-red-800">{errors.avatar}</p>}
    </fieldset>
    {message && <p role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm leading-5 text-red-800">{message}</p>}
    <div className="space-y-1">
      <button type="submit" disabled={auth.busy} className={actionClassName}>{auth.busy && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}{auth.busy ? "Saving changes…" : "Save changes"}</button>
      <button type="button" onClick={onCancel} disabled={auth.busy} className="min-h-11 w-full rounded-xl text-sm font-medium text-[color:var(--hs-text-secondary)] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-[color:var(--hs-green)]">Cancel</button>
    </div>
    <p role="status" className="sr-only">{auth.busy ? "Saving your profile. Please wait." : ""}</p>
  </form>;
}
