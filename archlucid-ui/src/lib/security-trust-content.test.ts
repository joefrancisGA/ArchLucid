import { describe, expect, it } from "vitest";

import {
  assuranceEvidenceClassification,
  assuranceMaturityBadgeLabel,
  securityTrustEngagementRows,
} from "@/lib/security-trust-content";

describe("security-trust-content helpers", () => {
  it("maps maturity tiers to customer-facing badge labels", () => {
    expect(assuranceMaturityBadgeLabel("available_now")).toBe("Available now");
    expect(assuranceMaturityBadgeLabel("during_diligence")).toBe("Available under NDA");
    expect(assuranceMaturityBadgeLabel("planned_next")).toBe("Planned");
  });

  it("classifies evidence access for public, NDA, and planned rows", () => {
    const publicRow = securityTrustEngagementRows.find((row) => row.id === "owner-security-self-assessment-2026");
    const ndaRow = securityTrustEngagementRows.find((row) => row.id === "internal-security-assessment-2026-q2");
    const plannedRow = securityTrustEngagementRows.find((row) => row.id === "pen-test-third-party-planned");

    expect(publicRow).toBeDefined();
    expect(ndaRow).toBeDefined();
    expect(plannedRow).toBeDefined();

    expect(assuranceEvidenceClassification(publicRow!)).toBe("Public");
    expect(assuranceEvidenceClassification(ndaRow!)).toBe("Available under NDA");
    expect(assuranceEvidenceClassification(plannedRow!)).toBe("Planned");
  });
});
