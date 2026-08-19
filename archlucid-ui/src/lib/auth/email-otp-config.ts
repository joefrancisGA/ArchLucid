import { readNextPublicAuthMode } from "@/lib/legacy-arch-env";

/** Mirrors API `Auth:EmailOtp:Enabled` — must be set explicitly for the operator UI. */
export function isEmailOtpAuthEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_ARCHLUCID_EMAIL_OTP_ENABLED?.trim().toLowerCase();

  return raw === "1" || raw === "true" || raw === "yes";
}

/** Email OTP can issue local JWTs; OIDC work/school requires jwt mode. */
export function isWorkSchoolSignInAvailable(): boolean {
  const mode = readNextPublicAuthMode();

  return mode === "jwt" || mode === "jwt-bearer";
}
