import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  let confirmed = false;
  try {
    const supabase = await createClient();
    if (code && code.length <= 4096) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      confirmed = !error;
    } else if (tokenHash && tokenHash.length <= 4096 && params.get("type") === "email") {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
      confirmed = !error;
    }
  } catch { /* Return a useful retry/sign-in state without exposing tokens. */ }
  // Never accept a caller-supplied redirect destination.
  const destination = new URL("/", request.url);
  destination.searchParams.set("auth", confirmed ? "confirmed" : "confirmation-error");
  const response = NextResponse.redirect(destination);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
