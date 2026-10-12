export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
export const PASSWORD_MIN_LENGTH = 8;
export type AuthFields = { username: string; email: string; password: string };
export type AuthFieldErrors = Partial<Record<keyof AuthFields, string>>;
export type AuthResult = { ok: true; confirmationRequired?: boolean } | { ok: false; message: string; field?: keyof AuthFields };

export function normalizeUsername(value: string) { return value.trim().toLowerCase(); }

export function validateAuthFields(fields: AuthFields, signup: boolean): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  if (signup && !USERNAME_PATTERN.test(normalizeUsername(fields.username))) errors.username = "Use 3–20 letters, numbers or underscores.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim()) || fields.email.trim().length > 254) errors.email = "Enter a valid email address.";
  if (!fields.password) errors.password = "Enter your password.";
  else if (signup && fields.password.length < PASSWORD_MIN_LENGTH) errors.password = "Use at least 8 characters.";
  return errors;
}

export function authErrorMessage(error: { code?: string; status?: number }): string {
  if (error.code === "invalid_credentials") return "That email and password don’t match. Please try again.";
  if (error.code === "email_not_confirmed") return "Check your email to confirm your account, then sign in.";
  if (error.code === "weak_password") return "Choose a stronger password with at least 8 characters. Try adding letters, numbers and symbols.";
  if (error.code === "email_address_invalid") return "Enter a valid email address.";
  if (error.code === "user_already_exists" || error.code === "email_exists") return "Unable to create this account. If you already have one, sign in.";
  if (error.status === 429 || error.code?.includes("rate_limit")) return "Too many attempts. Please wait a little and try again.";
  if (error.code === "signup_disabled") return "New accounts aren’t available right now. Please try again later.";
  return "We couldn’t complete that request. Please try again.";
}


export function validateRecoveryEmail(email: string): string | undefined {
  return validateAuthFields({ username: "", email, password: "unused" }, false).email;
}

export function validateNewPassword(password: string, confirmation: string) {
  const errors: { password?: string; confirmation?: string } = {};
  if (password.length < PASSWORD_MIN_LENGTH) errors.password = `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (!confirmation || password !== confirmation) errors.confirmation = "Your passwords don’t match.";
  return errors;
}

export const RECOVERY_EMAIL_SENT = "If an account exists with this email, we've sent a password reset link.";

export function recoveryRequestResult(error: { code?: string; status?: number; name?: string } | null): AuthResult {
  // Account-specific failures must have the same response as an unknown email.
  if (!error || ["user_not_found", "user_banned", "email_not_confirmed", "invalid_credentials"].includes(error.code ?? "")) return { ok: true };
  if (error.status === 429 || error.code?.includes("rate_limit")) return { ok: false, message: "Too many requests. Please wait a little before requesting another link." };
  return { ok: false, message: "We couldn’t send the request. Check your connection and try again shortly." };
}
