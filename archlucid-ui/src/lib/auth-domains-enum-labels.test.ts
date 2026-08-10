import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  AUTH_DOMAIN_RAW_ENUM_VISIBLE_BANNED,
  authDomainEnforcementModeKind,
  authDomainVerificationStatusKind,
  helperForAuthDomainEnforcementMode,
  helperForAuthDomainVerificationStatus,
  labelForAuthDomainEnforcementMode,
  labelForAuthDomainVerificationStatus,
} from "@/lib/auth-domains-enum-labels";

const repoRoot = join(import.meta.dirname, "..", "..");

function readUiSource(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

describe("auth-domains-enum-labels (TB-1891)", () => {
  it("maps verification statuses to buyer labels", () => {
    expect(labelForAuthDomainVerificationStatus("Unverified")).toBe("Not verified");
    expect(labelForAuthDomainVerificationStatus("VerificationPending")).toBe("Verification pending");
    expect(labelForAuthDomainVerificationStatus("Verified")).toBe("Verified");
    expect(labelForAuthDomainVerificationStatus("VerificationFailed")).toBe("Verification failed");
    expect(labelForAuthDomainVerificationStatus("Removed")).toBe("Removed");
    expect(authDomainVerificationStatusKind("Verified")).toBe("ready");
    expect(helperForAuthDomainVerificationStatus("VerificationPending")).toContain("DNS");
  });

  it("maps enforcement modes to buyer labels", () => {
    expect(labelForAuthDomainEnforcementMode("SsoOptional")).toBe("SSO optional");
    expect(labelForAuthDomainEnforcementMode("SsoRequiredForVerifiedDomain")).toBe("SSO required");
    expect(labelForAuthDomainEnforcementMode("SsoRequiredWithRecoveryException")).toBe(
      "SSO required with recovery",
    );
    expect(authDomainEnforcementModeKind("SsoOptional")).toBe("neutral");
    expect(helperForAuthDomainEnforcementMode("SsoRequiredWithRecoveryException")).toContain("recovery");
  });

  it("keeps raw enum tokens off visible auth-domains list copy", () => {
    const source = readUiSource("src/app/(operator)/administration/auth-domains/AuthDomainsPageClient.tsx");

    expect(source).not.toContain("{row.verificationStatus} ·");
    expect(source).not.toContain("enforcement active");

    for (const banned of AUTH_DOMAIN_RAW_ENUM_VISIBLE_BANNED) {
      expect(source).not.toContain(`${banned} ·`);
    }

    expect(source).toContain("labelForAuthDomainVerificationStatus");
    expect(source).toContain("labelForAuthDomainEnforcementMode");
    expect(source).toContain("data-verification-status");
    expect(source).toContain("data-enforcement-mode");
  });
});
