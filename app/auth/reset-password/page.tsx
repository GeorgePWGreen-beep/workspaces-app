import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { recoverySessionStatus, type RecoveryStatus } from "@/utils/passwordRecovery";
import ResetPassword from "@/components/ResetPassword";

export const metadata: Metadata = { title: "Reset your password — Hot Seats", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  let status: RecoveryStatus = params.error === "retry" ? "retry" : "invalid";
  if (!params.error) {
    try { status = await recoverySessionStatus((await createClient()).auth); }
    catch { status = "retry"; }
  }
  return <ResetPassword status={status} />;
}
