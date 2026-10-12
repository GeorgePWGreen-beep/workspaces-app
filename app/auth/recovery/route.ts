import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeRecoveryCode, type RecoveryStatus } from "@/utils/passwordRecovery";

export async function GET(request: NextRequest) {
  let status: RecoveryStatus = "invalid";
  try {
    if (!request.nextUrl.searchParams.has("error")) {
      const client = await createClient();
      status = await exchangeRecoveryCode(client.auth, request.nextUrl.searchParams.get("code"));
    }
  } catch { status = "retry"; }
  // Fixed local destination; discard codes and all provider error descriptions.
  const destination = new URL("/auth/reset-password", request.url);
  if (status !== "ready") destination.searchParams.set("error", status);
  const response = NextResponse.redirect(destination);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
