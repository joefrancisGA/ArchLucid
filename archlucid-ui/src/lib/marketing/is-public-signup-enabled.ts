/**
 * Mirrors backend Auth:PublicSignup:Mode. Only explicit public-self-service enables open signup UI.
 */
export type PublicSignupMode = "invite-only" | "public-self-service";

export function resolvePublicSignupMode(): PublicSignupMode {
  const raw = process.env.NEXT_PUBLIC_PUBLIC_SIGNUP_MODE?.trim().toLowerCase() ?? "";

  if (raw === "public-self-service" || raw === "publicselfservice") {
    return "public-self-service";
  }

  return "invite-only";
}

export function isPublicSelfServiceSignupEnabled(): boolean {
  return resolvePublicSignupMode() === "public-self-service";
}
