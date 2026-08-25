import type { TenantAuthDomainRecord } from "@/lib/admin-auth-domains-api";

export const AUTH_DOMAIN_LAST_VIEWED_STORAGE_KEY = "archlucid_auth_domain_continue_last_v1";

export type AuthDomainsContinueLastTarget = {
  readonly normalizedDomain: string;
  readonly displayDomain: string;
};

function readStoredDomain(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(AUTH_DOMAIN_LAST_VIEWED_STORAGE_KEY)?.trim() ?? "";

    return stored.length > 0 ? stored : null;
  } catch {
    return null;
  }
}

export function writeAuthDomainLastViewedId(normalizedDomain: string): void {
  const normalized = normalizedDomain.trim();

  if (normalized.length === 0 || typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(AUTH_DOMAIN_LAST_VIEWED_STORAGE_KEY, normalized);
  } catch {
    /* ignore */
  }
}

function isUnverified(domain: TenantAuthDomainRecord): boolean {
  return domain.verificationStatus !== "Verified";
}

function toTarget(domain: TenantAuthDomainRecord): AuthDomainsContinueLastTarget {
  return {
    normalizedDomain: domain.normalizedDomain,
    displayDomain: domain.displayDomain.trim().length > 0 ? domain.displayDomain : domain.normalizedDomain,
  };
}

/** Resolves the auth domain to pin as Continue last viewed. */
export function resolveContinueLastAuthDomain(
  domains: readonly TenantAuthDomainRecord[],
): AuthDomainsContinueLastTarget | null {
  if (domains.length === 0) {
    return null;
  }

  const storedId = readStoredDomain();

  if (storedId !== null) {
    const storedMatch = domains.find((domain) => domain.normalizedDomain === storedId);

    if (storedMatch !== undefined) {
      return toTarget(storedMatch);
    }
  }

  const unverified = domains.filter((domain) => isUnverified(domain));
  const pool = unverified.length > 0 ? unverified : domains;
  const newest = pool.slice().sort((left, right) => right.createdUtc.localeCompare(left.createdUtc))[0];

  return newest === undefined ? null : toTarget(newest);
}
