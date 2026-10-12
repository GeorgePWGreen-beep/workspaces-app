"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Check, LoaderCircle, MailCheck } from "lucide-react";
import { BrandLockup } from "./BrandMark";
import { accountActionStyle } from "./AccountSheet";
import { useAuth } from "./AuthProvider";
import { resetPassword } from "@/app/auth/reset-password/actions";
import { RECOVERY_EMAIL_SENT, validateNewPassword, validateRecoveryEmail } from "@/utils/auth";
import { INVALID_RECOVERY, type RecoveryStatus } from "@/utils/passwordRecovery";

const inputStyle = "h-13 w-full min-w-0 rounded-2xl border border-[color:var(--hs-border)] bg-white px-4 text-base outline-none focus:border-[color:var(--hs-green)] focus:ring-2 focus:ring-[color:var(--hs-green-soft)] disabled:opacity-60";

export default function ResetPassword({ status: initialStatus }: { status: RecoveryStatus }) {
  const auth = useAuth();
  const id = useId();
  const submitting = useRef(false);
  const [status, setStatus] = useState(initialStatus);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirmation?: string; email?: string }>({});
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current || auth.busy) return;
    const validation = status === "ready" ? validateNewPassword(password, confirmation) : { email: validateRecoveryEmail(email) };
    setErrors(validation); setMessage("");
    const invalid = Object.entries(validation).find(([, value]) => value)?.[0];
    if (invalid) { document.getElementById(`${id}-${invalid}`)?.focus(); return; }
    submitting.current = true; setBusy(true);
    try {
      if (status !== "ready") {
        const result = await auth.requestPasswordReset(email);
        if (result.ok) setSent(true); else setMessage(result.message);
      } else {
        const result = await resetPassword(password, confirmation);
        if (result.ok) { setPassword(""); setConfirmation(""); setDone(true); }
        else {
          setMessage(result.message);
          // Transient failures keep the entered form available for retry.
          if (result.status === "invalid") { setPassword(""); setConfirmation(""); setStatus("invalid"); }
        }
      }
    } catch { setMessage("We couldn’t connect. Check your connection and try again."); }
    finally { submitting.current = false; setBusy(false); }
  }

  return <main className="h-dvh overflow-y-auto overscroll-contain bg-[color:var(--hs-bg)] px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))] text-[color:var(--hs-text)]">
    <div className="mx-auto max-w-[400px]">
      <BrandLockup compact />
      <Link href="/" className="mb-6 mt-6 inline-flex min-h-11 items-center gap-2 text-sm text-[color:var(--hs-text-secondary)]"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to Hot Seats</Link>
      <section className="rounded-[28px] border border-[color:var(--hs-border)] bg-[color:var(--hs-surface)] p-6 shadow-[var(--hs-shadow-small)]">
        <h1 className="text-[30px] font-bold leading-[1.08] tracking-[-0.03em]">{done ? "Password updated" : sent ? "Check your email" : status === "ready" ? "Choose a new password" : "Let’s get you back in"}</h1>
        {done ? <div className="mt-5 space-y-5">
          <Check aria-hidden="true" className="h-10 w-10 text-[color:var(--hs-green)]" />
          <p role="status" className="text-sm leading-6">Your new password is saved. You’re ready to find your next study spot.</p>
          <button type="button" onClick={() => window.location.assign("/")} className={accountActionStyle}>Continue to Hot Seats</button>
        </div> : sent ? <div className="mt-5 space-y-5">
          <MailCheck aria-hidden="true" className="h-10 w-10 text-[color:var(--hs-green)]" />
          <p role="status" className="text-sm leading-6">{RECOVERY_EMAIL_SENT}</p>
          <p className="text-xs leading-5 text-[color:var(--hs-text-secondary)]">Check your spam folder too. Open the link in this browser.</p>
          <button type="button" onClick={() => { setSent(false); setMessage(""); }} className="min-h-11 text-sm text-[color:var(--hs-green-deep)] underline">Try another email or request again</button>
        </div> : <>
          <p role={status === "ready" ? undefined : "status"} className="mt-3 text-sm leading-6 text-[color:var(--hs-text-secondary)]">{status === "ready" ? "Use at least 8 characters. A longer password is even better." : status === "invalid" ? INVALID_RECOVERY : "We couldn’t check your reset link. Check your connection, then try again or request a new link below."}</p>
          {status === "retry" && <a href="/auth/reset-password" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[color:var(--hs-green-deep)] underline">Try again</a>}
          <form onSubmit={submit} noValidate className="mt-6 space-y-4">
            {status === "ready" ? (["password", "confirmation"] as const).map(field => <div key={field}>
              <label htmlFor={`${id}-${field}`} className="mb-2 block text-sm font-semibold">{field === "password" ? "New password" : "Confirm new password"}</label>
              <input id={`${id}-${field}`} name={field} type="password" autoComplete="new-password" required disabled={busy} maxLength={4096}
                value={field === "password" ? password : confirmation} onChange={event => { (field === "password" ? setPassword : setConfirmation)(event.target.value); setErrors({}); setMessage(""); }}
                aria-invalid={!!errors[field]} aria-describedby={errors[field] ? `${id}-${field}-error` : undefined} className={inputStyle} />
              {errors[field] && <p id={`${id}-${field}-error`} role="alert" className="mt-2 text-sm text-red-800">{errors[field]}</p>}
            </div>) : <div>
              <label htmlFor={`${id}-email`} className="mb-2 block text-sm font-semibold">Email</label>
              <input id={`${id}-email`} name="email" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} required maxLength={254} disabled={busy || auth.busy} value={email}
                onChange={event => { setEmail(event.target.value); setErrors({}); setMessage(""); }} aria-invalid={!!errors.email} aria-describedby={errors.email ? `${id}-email-error` : undefined} className={inputStyle} />
              {errors.email && <p id={`${id}-email-error`} role="alert" className="mt-2 text-sm text-red-800">{errors.email}</p>}
            </div>}
            <button type="submit" disabled={busy || auth.busy} className={accountActionStyle}>{busy && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}{busy ? status === "ready" ? "Saving password…" : "Sending link…" : status === "ready" ? "Save new password" : "Send a new reset link"}</button>
          </form>
        </>}
        {message && <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-3 text-sm leading-5 text-red-800">{message}</p>}
      </section>
    </div>
  </main>;
}
