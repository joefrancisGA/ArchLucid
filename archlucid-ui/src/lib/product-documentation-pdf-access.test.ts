import { describe, expect, it } from "vitest";

import { AUTHORITY_RANK } from "@/lib/nav-authority";
import type { CurrentPrincipal } from "@/lib/current-principal";
import { canDownloadHelpTopicPdf } from "@/lib/product-documentation-pdf-access";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

function principal(overrides: Partial<CurrentPrincipal> = {}): CurrentPrincipal {
  return {
    provenance: "api",
    syntheticReason: null,
    name: "Test Operator",
    roleClaimValues: ["Reader"],
    primaryAppRole: "Reader",
    maxAuthority: "ReadAuthority",
    authorityRank: AUTHORITY_RANK.ReadAuthority,
    hasEnterpriseOperatorSurfaces: false,
    hasCommittedArchitectureReview: false,
    hasRecognizedArchLucidRole: true,
    permissionClaimValues: [],
    ...overrides,
  };
}

function entry(pdfStatus: ProductDocumentationEntry["pdfStatus"]): ProductDocumentationEntry {
  return {
    slug: "cloud-connections-azure",
    title: "Azure cloud connections",
    summary: "Connect Azure securely.",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/CLOUD_CONNECTIONS.md"],
    pdfStatus,
    contentKind: "product-help",
  };
}

describe("canDownloadHelpTopicPdf (TB-726)", () => {
  it("allows public PDFs without authentication", () => {
    expect(canDownloadHelpTopicPdf(entry("public"), principal(), false)).toBe(true);
  });

  it("denies customer PDFs without inbound authorization", () => {
    expect(canDownloadHelpTopicPdf(entry("customer"), principal(), false)).toBe(false);
  });

  it("allows customer PDFs for recognized authenticated operators", () => {
    expect(canDownloadHelpTopicPdf(entry("customer"), principal(), true)).toBe(true);
  });

  it("denies customer PDFs for unsigned synthetic principals", () => {
    expect(
      canDownloadHelpTopicPdf(
        entry("customer"),
        principal({ hasRecognizedArchLucidRole: false, provenance: "synthetic", syntheticReason: "non-browser" }),
        true,
      ),
    ).toBe(false);
  });

  it("denies internal-runbook PDFs for non-admin operators", () => {
    expect(
      canDownloadHelpTopicPdf(
        {
          ...entry("internal"),
          contentKind: "internal-runbook",
        },
        principal(),
        true,
      ),
    ).toBe(false);
  });

  it("allows internal-runbook PDFs for admin operators", () => {
    expect(
      canDownloadHelpTopicPdf(
        {
          ...entry("internal"),
          contentKind: "internal-runbook",
        },
        principal({ authorityRank: AUTHORITY_RANK.AdminAuthority, maxAuthority: "AdminAuthority" }),
        true,
      ),
    ).toBe(true);
  });
});
