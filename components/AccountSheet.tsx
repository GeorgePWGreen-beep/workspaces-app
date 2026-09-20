"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Eye, EyeOff, LoaderCircle, MailCheck, UserRound, X } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { validateAuthFields, type AuthFieldErrors, type AuthFields } from "@/utils/auth";

export type AccountNotice = "confirmed" | "confirmation-error" | null;
const actionStyle = "flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[color:var(--hs-green)] px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-[color:var(--hs-green-deep)] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--hs-green)]";

export default function AccountSheet({ onClose, notice, onStudyPreferences }: { onClose: () => void; notice: AccountNotice; onStudyPreferences: () => void }) {
  const auth = useAuth();
  const [mode, setMode] = useState<"welcome" | "signup" | "signin" | "confirmation">(notice ? "signin" : "welcome");
  const [fields, setFields] = useState<AuthFields>({ username: "", email: "", password: "" });
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const prefix = useId();

  useEffect(() => {
    const dialog = dialogRef.current!;
    dialog.showModal(); headingRef.current?.focus();
    return () => dialog.close();
  }, []);

  function switchMode(next: typeof mode) {
    setMode(next); setErrors({}); setMessage(""); setShowPassword(false);
    setFields((current) => ({ ...current, password: "" }));
    window.requestAnimationFrame(() => headingRef.current?.focus());
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (auth.busy) return;
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
  const title = auth.user ? "Your account" : mode === "confirmation" ? "Check your email" : signup ? "Create your account" : mode === "signin" ? "Welcome back" : "Make yourself at home";
  const description = auth.user ? "Your place at Hot Seats." : mode === "confirmation" ? "One quick step to finish signing up." : signup ? "Choose your username to get started." : mode === "signin" ? "Sign in to your Hot Seats account." : "A little space of your own at Hot Seats.";

  function input(field: keyof AuthFields, label: string, hint?: string) {
    const password = field === "password";
    return <div>
      <label htmlFor={`${prefix}-${field}`} className="mb-2 block text-sm font-semibold">{label}</label>
      <div className="relative">
        <input id={`${prefix}-${field}`} name={field} value={fields[field]} required disabled={auth.busy}
          type={password ? showPassword ? "text" : "password" : field === "email" ? "email" : "text"}
          autoComplete={password ? signup ? "new-password" : "current-password" : field === "email" ? "email" : "username"}
          autoCapitalize="none" spellCheck={false} inputMode={field === "email" ? "email" : undefined}
          maxLength={field === "username" ? 20 : field === "email" ? 254 : undefined}
          aria-invalid={Boolean(errors[field])} aria-describedby={(hint ? `${prefix}-${field}-hint ` : "") + (errors[field] ? `${prefix}-${field}-error` : "") || undefined}
          onChange={(event) => { setFields({ ...fields, [field]: field === "username" ? event.target.value.toLowerCase() : event.target.value }); setErrors({ ...errors, [field]: undefined }); setMessage(""); }}
          onBlur={() => { const error = validateAuthFields(fields, signup)[field]; if (fields[field]) setErrors((current) => ({ ...current, [field]: error })); }}
          className={`h-13 w-full min-w-0 rounded-2xl border bg-white px-4 text-base outline-none transition-colors focus:ring-2 disabled:opacity-60 ${password ? "pr-14" : ""} ${errors[field] ? "border-red-700 focus:border-red-700 focus:ring-red-100" : "border-[color:var(--hs-border)] focus:border-[color:var(--hs-green)] focus:ring-[color:var(--hs-green-soft)]"}`} />
        {password && <button type="button" disabled={auth.busy} aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-1 grid w-12 place-items-center rounded-xl text-[color:var(--hs-text-secondary)] focus-visible:outline-2 focus-visible:outline-[color:var(--hs-green)]">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>}
      </div>
      {hint && <p id={`${prefix}-${field}-hint`} className="mt-1.5 text-xs leading-5 text-[color:var(--hs-text-secondary)]">{hint}</p>}
      {errors[field] && <p id={`${prefix}-${field}-error`} role="alert" className="mt-1.5 text-sm leading-5 text-red-800">{errors[field]}</p>}
    </div>;
  }

  return <dialog ref={dialogRef} aria-labelledby={titleId} aria-describedby={descriptionId}
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClick={(event) => { if (event.target !== event.currentTarget) return; const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose(); }}
    className="fixed inset-x-0 bottom-0 top-auto m-0 mx-auto max-h-[calc(100dvh-env(safe-area-inset-top)-16px)] w-full max-w-[460px] overflow-hidden rounded-t-[32px] border-0 bg-[color:var(--hs-bg)] p-0 text-[color:var(--hs-text)] shadow-2xl backdrop:bg-black/25 md:inset-0 md:m-auto md:max-h-[min(90dvh,780px)] md:rounded-[32px]">
    <div className="max-h-[inherit] overflow-y-auto overscroll-contain px-6 pt-5 pb-[max(24px,env(safe-area-inset-bottom))] sm:px-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        {mode !== "welcome" && !auth.user ? <button type="button" aria-label="Back to account options" disabled={auth.busy} onClick={() => switchMode("welcome")} className="grid h-11 w-11 place-items-center rounded-full border border-[color:var(--hs-border)] bg-white focus-visible:outline-2"><ArrowLeft className="h-5 w-5" /></button>
          : <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[color:var(--hs-green-soft)] text-[color:var(--hs-green-deep)]"><UserRound aria-hidden="true" className="h-5 w-5" /></span>}
        <button type="button" onClick={onClose} aria-label="Close account" className="grid h-11 w-11 place-items-center rounded-full border border-[color:var(--hs-border)] bg-white focus-visible:outline-2"><X aria-hidden="true" className="h-5 w-5" /></button>
      </div>
      <h2 ref={headingRef} id={titleId} tabIndex={-1} className="max-w-[320px] text-[30px] font-bold leading-[1.08] tracking-[-0.03em] outline-none">{title}</h2>
      <p id={descriptionId} className="mt-2 text-sm leading-6 text-[color:var(--hs-text-secondary)]">{description}</p>
      {notice && <p role="status" className="mt-4 rounded-2xl bg-[color:var(--hs-green-soft)] p-3 text-sm leading-5">{notice === "confirmed" ? auth.user ? "Email confirmed. You’re signed in." : "Email confirmed. You can sign in to your account." : "That confirmation link has expired or could not be opened. Try the newest link in your email, or sign in if you already confirmed."}</p>}
      {auth.error && <div role="alert" className="mt-4 rounded-2xl border border-[color:var(--hs-border)] bg-white p-3 text-sm leading-5">{auth.error}<button type="button" onClick={auth.retry} disabled={auth.loading} className="mt-2 block min-h-11 font-semibold text-[color:var(--hs-green-deep)] underline">Retry account</button></div>}
      {auth.loading ? <p role="status" className="flex items-center gap-2 py-8 text-sm text-[color:var(--hs-text-secondary)]"><LoaderCircle className="h-4 w-4 animate-spin" />Loading your account…</p>
        : auth.user ? <div className="mt-6 space-y-5">
          {auth.profile && <div className="rounded-2xl border border-[color:var(--hs-border)] bg-white p-4"><p className="break-words text-xl font-bold">{auth.profile.display_name || auth.profile.username}</p><p className="mt-1 break-all text-sm text-[color:var(--hs-text-secondary)]">@{auth.profile.username}</p></div>}
          <button type="button" onClick={onStudyPreferences} className="min-h-12 w-full rounded-2xl border border-[color:var(--hs-border)] bg-white px-4 py-3 text-left font-semibold">Study preferences</button>
          <div><p className="text-xs font-semibold text-[color:var(--hs-text-secondary)]">Email</p><p className="mt-1 break-all text-base">{auth.user.email}</p></div>
          <button type="button" disabled={auth.busy} onClick={async () => { setMessage(""); const result = await auth.signOut(); if (!result.ok) setMessage(result.message); else switchMode("welcome"); }} className={actionStyle}>{auth.busy ? "Logging out…" : "Log out"}</button>
        </div> : mode === "welcome" ? <div className="mt-7 space-y-3">
          <button type="button" onClick={() => switchMode("signup")} className={actionStyle}>Create account</button>
          <button type="button" onClick={() => switchMode("signin")} className="min-h-12 w-full rounded-2xl border border-[color:var(--hs-border)] bg-white px-4 py-3 text-base font-semibold focus-visible:outline-2">Sign in</button>
          <p className="pt-2 text-center text-xs leading-5 text-[color:var(--hs-text-secondary)]">Just browsing? The map is always here.</p>
        </div> : mode === "confirmation" ? <div className="mt-6 space-y-5">
          <MailCheck aria-hidden="true" className="h-10 w-10 text-[color:var(--hs-green)]" />
          <p role="status" className="break-words text-sm leading-6">Check <strong>{fields.email.trim()}</strong> for your confirmation link, then return to sign in. Check your spam folder too. If you already have an account, sign in below.</p>
          <button type="button" onClick={() => switchMode("signin")} className={actionStyle}>Back to sign in</button>
        </div> : <form onSubmit={submit} noValidate className="mt-6 space-y-4">
          {signup && input("username", "Username", "3–20 lowercase letters, numbers or underscores.")}
          {input("email", "Email")}
          {input("password", "Password", signup ? "At least 8 characters. A longer password is even better." : undefined)}
          <button type="submit" disabled={auth.busy} className={`${actionStyle} mt-6`}>{auth.busy && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}{auth.busy ? signup ? "Creating account…" : "Signing in…" : signup ? "Create account" : "Sign in"}</button>
          <button type="button" disabled={auth.busy} onClick={() => switchMode(signup ? "signin" : "signup")} className="min-h-11 w-full text-sm font-medium text-[color:var(--hs-green-deep)] underline underline-offset-4">{signup ? "Already have an account? Sign in" : "New to Hot Seats? Create account"}</button>
        </form>}
      {message && <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-3 text-sm leading-5 text-red-800">{message}</p>}
    </div>
  </dialog>;
}
