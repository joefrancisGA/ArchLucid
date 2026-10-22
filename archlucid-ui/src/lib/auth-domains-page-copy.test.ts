import { describe, expect, it } from "vitest";

import {
  authDomainsAdminAuthorityPresentation,
  authDomainsTenantScopeLine,
  authDomainsTenantSignInPosture,
  isPlausibleAuthDomainInput,
  resolveAuthDomainsCurrentWorkspaceLabel,
  resolveAuthDomainsJourneyStep,
} from "@/lib/auth-domains-page-copy";

describe("auth-domains-page-copy", () => {
  it("resolves the current workspace label from scope", () => {
    expect(
      resolveAuthDomainsCurrentWorkspaceLabel({
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        projectId: "project-1",
        workspaceLabel: "Claims Intake Demo",
        projectLabel: "Default project",
      }),
    ).toBe("Claims Intake Demo");
  });

  it("never surfaces a raw tenant id when the workspace is unlabelled", () => {
    expect(resolveAuthDomainsCurrentWorkspaceLabel(null)).toBeNull();
    expect(
      resolveAuthDomainsCurrentWorkspaceLabel({
        tenantId: "6f1b0f52-0f0a-4d51-9a2e-2c2b8d5f9a11",
        workspaceId: "workspace-1",
        projectId: "project-1",
        workspaceLabel: "   ",
        projectLabel: "Default project",
      }),
    ).toBeNull();
  });

  it("builds tenant scope line for the page header", () => {
    expect(authDomainsTenantScopeLine("Claims Intake Demo")).toContain("Claims Intake Demo");
    expect(authDomainsTenantScopeLine("Claims Intake Demo")).toContain("tenant-wide");
  });

  it("keeps the scope line tenant-wide when no workspace label is known", () => {
    const line = authDomainsTenantScopeLine(null);

    expect(line).toContain("tenant-wide");
    expect(line).toContain("every workspace in this organization");
  });

  it("resolves journey step from domain readiness", () => {
    expect(
      resolveAuthDomainsJourneyStep({
        domainCount: 0,
        selectedDomain: null,
        domains: [],
      }),
    ).toBe("add");

    expect(
      resolveAuthDomainsJourneyStep({
        domainCount: 1,
        selectedDomain: {
          verificationStatus: "Unverified",
          routingTestPassedUtc: null,
        },
        domains: [
          {
            verificationStatus: "Unverified",
            routingTestPassedUtc: null,
          },
        ],
      }),
    ).toBe("verify-dns");

    expect(
      resolveAuthDomainsJourneyStep({
        domainCount: 1,
        selectedDomain: {
          verificationStatus: "Verified",
          routingTestPassedUtc: "2026-07-02T00:00:00.000Z",
        },
        domains: [
          {
            verificationStatus: "Verified",
            routingTestPassedUtc: "2026-07-02T00:00:00.000Z",
          },
        ],
      }),
    ).toBe("enforce");
  });

  it("validates plausible domain input", () => {
    expect(isPlausibleAuthDomainInput("example.com")).toBe(true);
    expect(isPlausibleAuthDomainInput("not-a-domain")).toBe(false);
    expect(isPlausibleAuthDomainInput("user@example.com")).toBe(false);
  });

  it("presents admin authority as ready or blocked", () => {
    expect(authDomainsAdminAuthorityPresentation(true).kind).toBe("ready");
    expect(authDomainsAdminAuthorityPresentation(false).kind).toBe("needs-attention");
  });

  it("describes tenant sign-in posture for zero and configured domains", () => {
    const zeroDomains = authDomainsTenantSignInPosture([]);

    expect(zeroDomains.label).toContain("Email code");
    expect(zeroDomains.detail).toContain("SSO is not active");

    const configured = authDomainsTenantSignInPosture([
      { verificationStatus: "Verified", isEnforcementActive: true },
      { verificationStatus: "Unverified", isEnforcementActive: false },
    ]);

    expect(configured.label).toContain("enforcing SSO");
    expect(configured.detail).toContain("1 of 2");
  });
});
