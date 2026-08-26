import type { TenantAuthDomainRecord } from "@/lib/admin-auth-domains-api";
import { asNonemptyReadonlyArray } from "@/lib/continue-last-list-guard";

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
export function resolveContinueLastAuthDomain(domains: unknown): AuthDomainsContinueLastTarget | null {
  const normalizedDomains = asNonemptyReadonlyArray<TenantAuthDomainRecord>(domains);

  if (normalizedDomains === null) {
    return null;
  }

  const storedId = readStoredDomain();

  if (storedId !== null) {
    const storedMatch = normalizedDomains.find((domain) => domain.normalizedDomain === storedId);

    if (storedMatch !== undefined) {
      return toTarget(storedMatch);
    }
  }

  const unverified = normalizedDomains.filter((domain) => isUnverified(domain));
  const pool = unverified.length > 0 ? unverified : normalizedDomains;
  const newest = pool.slice().sort((left, right) => right.createdUtc.localeCompare(left.createdUtc))[0];

  return newest === undefined ? null : toTarget(newest);
}
