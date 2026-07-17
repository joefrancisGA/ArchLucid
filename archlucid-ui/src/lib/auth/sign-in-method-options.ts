import { authorityHostnameMatches } from "@/lib/auth/oidc-authority-host";
import { isEmailOtpAuthEnabled, isWorkSchoolSignInAvailable } from "@/lib/auth/email-otp-config";
import { assertOidcSignInConfig, getOidcAuthority } from "@/lib/oidc/config";

export type SupplementalSignInProvider = "microsoft" | "google";

export type SignInMethodOptions = {
  readonly workSchool: boolean;
  readonly emailCode: boolean;
  readonly supplementalProviders: readonly SupplementalSignInProvider[];
};

/**
 * Optional Microsoft / Google buttons appear only when explicitly enabled and the
 * configured OIDC authority matches that provider (no unsupported IdP advertising).
 */
export function resolveSignInMethodOptions(): SignInMethodOptions {
  const workSchool =
    isWorkSchoolSignInAvailable() && assertOidcSignInConfig().ok;

  const emailCode = isEmailOtpAuthEnabled();

  const supplementalProviders: SupplementalSignInProvider[] = [];

  if (workSchool && isSupplementalProviderEnabled("microsoft")) {
    const authority = getOidcAuthority();

    if (authorityHostnameMatches(authority, ["login.microsoftonline.com"])) {
      supplementalProviders.push("microsoft");
    }
  }

  if (isSupplementalProviderEnabled("google")) {
    const googleAuthority = process.env.NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY?.trim() ?? "";

    if (authorityHostnameMatches(googleAuthority, ["accounts.google.com"])) {
      supplementalProviders.push("google");
    }
  }

  return {
    workSchool,
    emailCode,
    supplementalProviders,
  };
}

function isSupplementalProviderEnabled(provider: SupplementalSignInProvider): boolean {
  const raw = process.env.NEXT_PUBLIC_ARCHLUCID_SUPPLEMENTAL_SIGN_IN_PROVIDERS?.trim().toLowerCase() ?? "";

  if (raw.length === 0) {
    return false;
  }

  const tokens = raw.split(/[,\s]+/).map((part) => part.trim());

  return tokens.includes(provider);
}
