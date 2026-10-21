"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Bookmark, ChevronDown, ChevronRight, Eye, EyeOff, LoaderCircle, LogOut, MailCheck, SlidersHorizontal, UserRound, UsersRound, X } from "lucide-react";
import { useAuth } from "./AuthProvider";
import BrandMark, { BrandLockup } from "./BrandMark";
import EditProfile from "./EditProfile";
import ProfileAvatar from "./ProfileAvatar";
import { RECOVERY_EMAIL_SENT, validateRecoveryEmail, validateAuthFields, type AuthFieldErrors, type AuthFields } from "@/utils/auth";

export type AccountNotice = "confirmed" | "confirmation-error" | null;
export const accountActionStyle = "flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[color:var(--hs-green)] px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-[color:var(--hs-green-deep)] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--hs-green)]";
const secondaryActionStyle = "flex min-h-12 w-full items-center justify-center rounded-2xl border border-[color:var(--hs-border)] bg-white px-4 py-3 text-base font-semibold transition-colors hover:bg-[color:var(--hs-green-soft)] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--hs-green)]";
const navigationStyle = "grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[color:var(--hs-border)] bg-white text-[color:var(--hs-text-secondary)] transition-colors hover:bg-[color:var(--hs-green-soft)] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--hs-green)]";
const profileRowStyle = "flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[color:var(--hs-green-soft)] disabled:opacity-60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[color:var(--hs-green)]";
const profileIconStyle = "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[color:var(--hs-green-soft)] text-[color:var(--hs-green-deep)]";

export default function AccountSheet({ onClose, notice, onStudyPreferences, onOpenSaved, onOpenFriends, initialMode = "welcome" }: { onClose: () => void; notice: AccountNotice; onStudyPreferences: () => void; onOpenSaved: () => void; onOpenFriends: () => void; initialMode?: "welcome" | "signin" | "signup" }) {
  const auth = useAuth();
  const [mode, setMode] = useState<"welcome" | "signup" | "signin" | "confirmation" | "recovery" | "recovery-sent">(notice ? "signin" : initialMode);
  const [fields, setFields] = useState<AuthFields>({ username: "", email: "", password: "" });
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState("");
  const editTrigger = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const prefix = useId();
  const editing = editingProfile && Boolean(auth.user && auth.profile);

  function finishEditing(saved = false) {
    if (auth.busy && !saved) return;
    setEditingProfile(false);
    setProfileNotice(saved ? "Profile updated." : "");
    window.requestAnimationFrame(() => editTrigger.current?.focus({ preventScroll: true }));
  }
  function dismiss() {
    if (editing) finishEditing();
    else onClose();
  }

  useEffect(() => {
    const dialog = dialogRef.current!;
    dialog.showModal(); headingRef.current?.focus();
    // iOS's keyboard resizes the visual viewport, rather than 100dvh.
    const viewport = window.visualViewport;
    function fitViewport() {
      if (!viewport) return;
      dialog.style.setProperty("--account-viewport-height", `${viewport.height}px`);
      dialog.style.setProperty("--account-viewport-bottom", `${Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)}px`);
    }
    fitViewport();
    viewport?.addEventListener("resize", fitViewport);
    viewport?.addEventListener("scroll", fitViewport);
    return () => {
      viewport?.removeEventListener("resize", fitViewport);
      viewport?.removeEventListener("scroll", fitViewport);
      dialog.close();
    };
  }, []);

  function switchMode(next: typeof mode) {
    setMode(next); setErrors({}); setMessage(""); setShowPassword(false);
    setFields((current) => ({ ...current, password: "" }));
    window.requestAnimationFrame(() => headingRef.current?.focus());
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (auth.busy) return;
    if (mode === "recovery") {
      const emailError = validateRecoveryEmail(fields.email);
      setErrors(emailError ? { email: emailError } : {}); setMessage("");
      if (emailError) { document.getElementById(`${prefix}-email`)?.focus(); return; }
      const result = await auth.requestPasswordReset(fields.email);
      if (result.ok) switchMode("recovery-sent");
      else setMessage(result.message);
      return;
    }
    const validation = validateAuthFields(fields, mode === "signup");
    setErrors(validation); setMessage("");
    const invalid = Object.keys(validation)[0];
    if (invalid) { document.getElementById(`${prefix}-${invalid}`)?.focus(); return; }
    const result = await (mode === "signup" ? auth.signUp(fields) : auth.signIn(fields));
    if (!result.ok) {
      if (result.field) { setErrors({ [result.field]: result.message }); document.getElementById(`${prefix}-${result.field}`)?.focus(); }
      else setMessage(result.message);
      return;
    }
    setMessage("");
    setFields((current) => ({ ...current, password: "" }));
    if (result.confirmationRequired) switchMode("confirmation");
  }

  const signup = mode === "signup";
  const recovery = mode === "recovery" || mode === "recovery-sent";
  const profileName = auth.profile?.display_name?.trim() || auth.profile?.username || "Your profile";
  const title = editing ? "Edit profile" : recovery ? mode === "recovery-sent" ? "Check your email" : "Forgot your password?" : auth.user ? "Your account" : mode === "confirmation" ? "Check your email" : signup ? "Create your account" : mode === "signin" ? "Welcome back" : "Make yourself at home";
  const description = editing ? "Choose how you appear on Hot Seats." : recovery ? "We’ll help you get back to your study spots." : auth.user ? "Your place at Hot Seats." : mode === "confirmation" ? "One quick step to finish signing up." : signup ? "Your favourite cafés, all in one place." : mode === "signin" ? "Your favourite study spots are waiting for you." : "Save cafés you love, keep your study preferences and connect with friends.";

  function input(field: keyof AuthFields, label: string, hint?: string) {
    const password = field === "password";
    return <div>
      <label htmlFor={`${prefix}-${field}`} className="mb-2 block text-sm font-semibold tracking-[-0.01em]">{label}</label>
      <div className="relative">
        <input id={`${prefix}-${field}`} name={field} value={fields[field]} required disabled={auth.busy}
          type={password ? showPassword ? "text" : "password" : field === "email" ? "email" : "text"}
          autoComplete={password ? signup ? "new-password" : "current-password" : field === "email" ? "email" : "username"}
          autoCapitalize="none" spellCheck={false} inputMode={field === "email" ? "email" : undefined}
          placeholder={field === "email" ? "you@example.com" : field === "username" ? "Your username" : signup ? "Create a password" : "Your password"}
          maxLength={field === "username" ? 20 : field === "email" ? 254 : undefined}
          aria-invalid={Boolean(errors[field])} aria-describedby={(hint ? `${prefix}-${field}-hint ` : "") + (errors[field] ? `${prefix}-${field}-error` : "") || undefined}
          onChange={(event) => { setFields({ ...fields, [field]: field === "username" ? event.target.value.toLowerCase() : event.target.value }); setErrors({ ...errors, [field]: undefined }); setMessage(""); }}
          onBlur={() => { const error = validateAuthFields(fields, signup)[field]; if (fields[field]) setErrors((current) => ({ ...current, [field]: error })); }}
          className={`h-13 w-full min-w-0 scroll-my-5 rounded-2xl border bg-white px-4 text-base outline-none transition-colors placeholder:text-[color:var(--hs-text-tertiary)] focus:ring-2 disabled:opacity-60 ${password ? "pr-14" : ""} ${errors[field] ? "border-red-700 focus:border-red-700 focus:ring-red-100" : "border-[color:var(--hs-border)] focus:border-[color:var(--hs-green)] focus:ring-[color:var(--hs-green-soft)]"}`} />
        {password && <button type="button" disabled={auth.busy} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-1 grid w-12 place-items-center rounded-xl text-[color:var(--hs-text-secondary)] hover:text-[color:var(--hs-text)] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-[color:var(--hs-green)]">{showPassword ? <EyeOff aria-hidden="true" className="h-4.5 w-4.5" /> : <Eye aria-hidden="true" className="h-4.5 w-4.5" />}</button>}
      </div>
      {hint && <p id={`${prefix}-${field}-hint`} className="mt-1.5 text-xs leading-5 text-[color:var(--hs-text-secondary)]">{hint}</p>}
      {errors[field] && <p id={`${prefix}-${field}-error`} role="alert" className="mt-1.5 text-sm leading-5 text-red-800">{errors[field]}</p>}
    </div>;
  }

  return <dialog ref={dialogRef} aria-labelledby={titleId} aria-describedby={descriptionId}
    onCancel={(event) => { event.preventDefault(); dismiss(); }}
    onClick={(event) => { if (event.target !== event.currentTarget) return; const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dismiss(); }}
    className="fixed inset-x-0 bottom-[var(--account-viewport-bottom,0px)] top-auto m-0 mx-auto max-h-[calc(var(--account-viewport-height,100dvh)-env(safe-area-inset-top)-16px)] w-full max-w-[460px] overflow-hidden rounded-t-[32px] border-0 bg-[color:var(--hs-bg)] p-0 text-[color:var(--hs-text)] shadow-2xl backdrop:bg-black/25 md:inset-0 md:m-auto md:max-h-[min(90dvh,780px,calc(var(--account-viewport-height,100dvh)-32px))] md:rounded-[32px]">
    <div className="max-h-[inherit] overflow-y-auto overscroll-contain scroll-py-5 px-6 pt-5 pb-[max(24px,env(safe-area-inset-bottom))] sm:px-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        {editing ? <>
          <button type="button" aria-label="Back to your profile" disabled={auth.busy} onClick={() => finishEditing()} className={navigationStyle}><ArrowLeft aria-hidden="true" className="h-5 w-5" /></button>
          <BrandMark className="h-9 w-9" />
        </> : mode !== "welcome" && !auth.user ? <>
          <button type="button" aria-label={recovery ? "Back to sign in" : "Back to account options"} disabled={auth.busy} onClick={() => switchMode(recovery ? "signin" : "welcome")} className={navigationStyle}><ArrowLeft aria-hidden="true" className="h-5 w-5" /></button>
          <BrandMark className="h-9 w-9" />
        </> : <BrandLockup compact />}
        <button type="button" onClick={dismiss} disabled={editing && auth.busy} aria-label={editing ? "Cancel editing" : "Close account"} className={navigationStyle}><X aria-hidden="true" className="h-5 w-5" /></button>
      </div>
      <h2 ref={headingRef} id={titleId} tabIndex={-1} className={auth.user && !editing ? "sr-only" : "max-w-[340px] text-[30px] font-semibold leading-[1.15] tracking-[-0.035em] outline-none"}>{title}</h2>
      <p id={descriptionId} className={auth.user && !editing ? "sr-only" : "mt-2.5 text-[15px] leading-6 text-[color:var(--hs-text-secondary)]"}>{description}</p>
      {notice && <p role="status" className="mt-4 rounded-2xl bg-[color:var(--hs-green-soft)] p-3 text-sm leading-5">{notice === "confirmed" ? auth.user ? "Email confirmed. You’re signed in." : "Email confirmed. You can sign in to your account." : "That confirmation link has expired or could not be opened. Try the newest link in your email, or sign in if you already confirmed."}</p>}
      {auth.error && <div role="alert" className="mt-4 rounded-2xl border border-[color:var(--hs-border)] bg-white p-3 text-sm leading-5">{auth.error}<button type="button" onClick={auth.retry} disabled={auth.loading} className="mt-2 block min-h-11 font-semibold text-[color:var(--hs-green-deep)] underline">Retry account</button></div>}
      {auth.loading ? <p role="status" className="flex items-center gap-2 py-8 text-sm text-[color:var(--hs-text-secondary)]"><LoaderCircle className="h-4 w-4 animate-spin" />Loading your account…</p>
        : editing && auth.profile ? <EditProfile key={auth.profile.id} profile={auth.profile} onCancel={() => finishEditing()} onSaved={() => finishEditing(true)} actionClassName={accountActionStyle} /> : auth.user ? <div>
          <header className="text-center">
            <ProfileAvatar name={auth.profile ? profileName : "Hot Seats"} source={auth.profile?.avatar_url} size="large" className="border-4 border-white shadow-[var(--hs-shadow-small)]" />
            <h3 className="mt-3 break-words text-[27px] font-semibold leading-tight tracking-[-0.035em]">{profileName}</h3>
            {auth.profile && <p className="mt-1 break-all text-sm text-[color:var(--hs-text-secondary)]">@{auth.profile.username}</p>}
            {auth.profile && <button ref={editTrigger} type="button" disabled={auth.busy} onClick={() => { setEditingProfile(true); setProfileNotice(""); setMessage(""); window.requestAnimationFrame(() => headingRef.current?.focus()); }} className="mt-3 min-h-11 rounded-full border border-[color:var(--hs-border)] bg-white px-6 text-sm font-semibold text-[color:var(--hs-green-deep)] hover:bg-[color:var(--hs-green-soft)] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--hs-green)]">Edit profile</button>}
            {profileNotice && <p role="status" className="mt-2 text-sm text-[color:var(--hs-green-deep)]">{profileNotice}</p>}
          </header>
          <nav aria-label="Your Hot Seats" className="mt-6 overflow-hidden rounded-[var(--hs-radius-card)] border border-[color:var(--hs-border)] bg-white shadow-[var(--hs-shadow-small)]">
            {[
              { label: "Study preferences", detail: "Find your kind of study spot", icon: SlidersHorizontal, onClick: onStudyPreferences },
              { label: "Saved cafés", detail: "All your favourite places", icon: Bookmark, onClick: onOpenSaved },
              { label: "Friends", detail: "Stay connected with your study people", icon: UsersRound, onClick: onOpenFriends },
            ].map(({ label, detail, icon: Icon, onClick }, index) => <div key={label} className={index ? "border-t border-[color:var(--hs-border)]" : undefined}>
              <button type="button" onClick={onClick} disabled={auth.busy} className={profileRowStyle}>
                <span className={profileIconStyle}><Icon aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.8} /></span>
                <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold tracking-[-0.01em]">{label}</span><span className="mt-0.5 block text-xs leading-4 text-[color:var(--hs-text-secondary)]">{detail}</span></span>
                <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-[color:var(--hs-text-tertiary)]" />
              </button>
            </div>)}
          </nav>
          <details open className="group mt-4 overflow-hidden rounded-[var(--hs-radius-card)] border border-[color:var(--hs-border)] bg-white">
            <summary className={`${profileRowStyle} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[color:var(--hs-bg)] text-[color:var(--hs-text-secondary)]"><UserRound aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.8} /></span>
              <span className="flex-1 text-[15px] font-semibold tracking-[-0.01em]">Account details</span>
              <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-[color:var(--hs-text-tertiary)] group-open:rotate-180" />
            </summary>
            <dl className="mx-4 border-t border-[color:var(--hs-border)] py-3">
              <dt className="text-xs text-[color:var(--hs-text-tertiary)]">Email address</dt>
              <dd className="mt-1 break-all text-sm leading-5 text-[color:var(--hs-text-secondary)]">{auth.user.email}</dd>
            </dl>
          </details>
          <button type="button" disabled={auth.busy} aria-live="polite" onClick={async () => { setMessage(""); const result = await auth.signOut(); if (!result.ok) setMessage(result.message); else switchMode("welcome"); }} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-[color:var(--hs-text-secondary)] transition-colors hover:bg-[color:var(--hs-green-soft)] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-[color:var(--hs-green)]">
            {auth.busy ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <LogOut aria-hidden="true" className="h-4 w-4" />}{auth.busy ? "Logging out…" : "Log out"}
          </button>
        </div> : mode === "welcome" ? <div className="mt-7 space-y-3">
          <button type="button" onClick={() => switchMode("signup")} className={accountActionStyle}>Create account</button>
          <button type="button" onClick={() => switchMode("signin")} className={secondaryActionStyle}>Sign in</button>
          <div className="mt-5 border-t border-[color:var(--hs-border)] pt-3 text-center">
            <button type="button" onClick={onStudyPreferences} className="min-h-11 w-full rounded-xl text-sm font-semibold text-[color:var(--hs-green-deep)] focus-visible:outline-2 focus-visible:outline-[color:var(--hs-green)]">Study preferences</button>
            <p className="text-xs leading-5 text-[color:var(--hs-text-secondary)]">Make it yours. No account needed.</p>
          </div>
        </div> : mode === "recovery-sent" ? <div className="mt-6 space-y-5">
          <MailCheck aria-hidden="true" className="h-10 w-10 text-[color:var(--hs-green)]" />
          <p role="status" className="text-sm leading-6">{RECOVERY_EMAIL_SENT}</p>
          <p className="text-xs leading-5 text-[color:var(--hs-text-secondary)]">Check your spam folder too. Open the link in this browser to choose a new password.</p>
          <button type="button" onClick={() => switchMode("signin")} className={accountActionStyle}>Back to sign in</button>
          <button type="button" onClick={() => switchMode("recovery")} className="min-h-11 w-full text-sm text-[color:var(--hs-green-deep)] underline">Try another email or request again</button>
        </div> : mode === "confirmation" ? <div className="mt-6 space-y-5">
          <MailCheck aria-hidden="true" className="h-10 w-10 text-[color:var(--hs-green)]" />
          <p role="status" className="break-words text-sm leading-6">Check <strong>{fields.email.trim()}</strong> for your confirmation link, then return to sign in. Check your spam folder too. If you already have an account, sign in below.</p>
          <button type="button" onClick={() => switchMode("signin")} className={accountActionStyle}>Back to sign in</button>
        </div> : <form onSubmit={submit} noValidate aria-busy={auth.busy} className="mt-6 space-y-4">
          {signup && input("username", "Username", "3–20 lowercase letters, numbers or underscores.")}
          {input("email", "Email")}
          {!recovery && input("password", "Password", signup ? "At least 8 characters. A longer password is even better." : undefined)}
          {mode === "signin" && <div className="-mt-1 flex justify-end"><button type="button" disabled={auth.busy} onClick={() => switchMode("recovery")} className="min-h-11 rounded-lg px-1 text-sm font-medium text-[color:var(--hs-green-deep)] underline-offset-4 hover:underline disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-[color:var(--hs-green)]">Forgot password?</button></div>}
          {message && <p role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm leading-5 text-red-800">{message}</p>}
          <button type="submit" disabled={auth.busy} aria-live="polite" className={`${accountActionStyle} mt-5`}>{auth.busy && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}{auth.busy ? recovery ? "Sending link…" : signup ? "Creating account…" : "Signing in…" : recovery ? "Send reset link" : signup ? "Create account" : "Sign in"}</button>
          {mode === "signin" ? <div className="border-t border-[color:var(--hs-border)] pt-4">
            <p className="mb-3 text-center text-sm text-[color:var(--hs-text-secondary)]">New to Hot Seats?</p>
            <button type="button" disabled={auth.busy} onClick={() => switchMode("signup")} className={secondaryActionStyle}>Create an account</button>
          </div> : <button type="button" disabled={auth.busy} onClick={() => switchMode("signin")} className="min-h-11 w-full rounded-xl text-sm font-medium text-[color:var(--hs-green-deep)] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-[color:var(--hs-green)]">{recovery ? "Back to sign in" : <><span className="text-[color:var(--hs-text-secondary)]">Already have an account?</span> <span className="font-semibold">Sign in</span></>}</button>}
        </form>}
      {message && (auth.user || mode === "welcome" || mode === "confirmation" || mode === "recovery-sent") && <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-3 text-sm leading-5 text-red-800">{message}</p>}
    </div>
  </dialog>;
}
