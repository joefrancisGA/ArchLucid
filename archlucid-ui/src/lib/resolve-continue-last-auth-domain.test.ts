import { describe, expect, it } from "vitest";

import type { TenantAuthDomainRecord } from "@/lib/admin-auth-domains-api";
import {
  AUTH_DOMAIN_LAST_VIEWED_STORAGE_KEY,
  resolveContinueLastAuthDomain,
} from "@/lib/resolve-continue-last-auth-domain";

function domain(overrides: Partial<TenantAuthDomainRecord> = {}): TenantAuthDomainRecord {
  return {
    tenantId: "t1",
    displayDomain: "example.com",
    normalizedDomain: "example.com",
    verificationStatus: "Verified",
    enforcementMode: "SsoOptional",
    requireEnterpriseSso: false,
    allowEmailOtpRecovery: true,
    createdUtc: "2026-07-01T00:00:00.000Z",
    isEnforcementActive: false,
    ...overrides,
  };
}

describe("resolveContinueLastAuthDomain", () => {
  it("returns null when input is not an array", () => {
    expect(resolveContinueLastAuthDomain(null)).toBeNull();
    expect(resolveContinueLastAuthDomain({})).toBeNull();
    expect(resolveContinueLastAuthDomain("nope")).toBeNull();
    expect(resolveContinueLastAuthDomain([])).toBeNull();
  });

  it("returns the stored domain when it still exists", () => {
    window.localStorage.setItem(AUTH_DOMAIN_LAST_VIEWED_STORAGE_KEY, "later.com");

    const match = resolveContinueLastAuthDomain([
      domain({ normalizedDomain: "example.com", displayDomain: "example.com" }),
      domain({ normalizedDomain: "later.com", displayDomain: "later.com" }),
    ]);

    expect(match?.normalizedDomain).toBe("later.com");
  });

  it("falls back to the newest unverified domain", () => {
    window.localStorage.removeItem(AUTH_DOMAIN_LAST_VIEWED_STORAGE_KEY);

    const match = resolveContinueLastAuthDomain([
      domain({
        normalizedDomain: "verified.com",
        displayDomain: "verified.com",
        verificationStatus: "Verified",
        createdUtc: "2026-08-20T00:00:00.000Z",
      }),
      domain({
        normalizedDomain: "pending-old.com",
        displayDomain: "pending-old.com",
        verificationStatus: "VerificationPending",
        createdUtc: "2026-01-01T00:00:00.000Z",
      }),
      domain({
        normalizedDomain: "pending-new.com",
        displayDomain: "pending-new.com",
        verificationStatus: "Unverified",
        createdUtc: "2026-08-01T00:00:00.000Z",
      }),
    ]);

    expect(match?.normalizedDomain).toBe("pending-new.com");
  });
});
