import { describe, expect, it } from "vitest";

import { buildArchitectureRiskRegisterCsv } from "@/lib/architecture/architecture-risk-register-csv";

describe("buildArchitectureRiskRegisterCsv", () => {
  it("maps last reviewed and next review columns separately from waiver expiry", () => {
    const csv = buildArchitectureRiskRegisterCsv([
      {
        recordKind: "finding",
        runId: "run-1",
        findingId: "f-1",
        title: "PHI exposure",
        severity: "High",
        category: "Claims intake",
        status: "Accepted · monitoring",
        recommended: "Review with security owner",
        ownerUserId: "owner-1",
        agingDays: 12,
        isStale: true,
        lastReviewedUtc: "2026-05-01T12:00:00Z",
        waiverExpiresAtUtc: "2026-07-01T12:00:00Z",
        revisitDueUtc: "2026-06-15T12:00:00Z",
        evidenceHref: "/architecture/reviews/run-1/findings/f-1/evidence-trace",
      },
    ]);

    expect(csv).toContain("2026-05-01T12:00:00Z");
    expect(csv).toContain("2026-06-15T12:00:00Z");
    expect(csv).not.toContain("2026-07-01T12:00:00Z");
  });

  it("emits buyer-facing columns for finding rows only", () => {
    const csv = buildArchitectureRiskRegisterCsv([
      {
        recordKind: "finding",
        runId: "run-1",
        findingId: "f-1",
        title: "PHI exposure",
        severity: "High",
        category: "Claims intake",
        status: "Accepted · monitoring",
        recommended: "Review with security owner",
        ownerUserId: "owner-1",
        agingDays: 12,
        isStale: true,
        evidenceHref: "/architecture/reviews/run-1/findings/f-1/evidence-trace",
      },
      {
        recordKind: "decision",
        runId: "run-1",
        findingId: "d-1",
        title: "Ignore me",
        severity: "Info",
        category: "Decision",
        status: "Recorded",
        recommended: "N/A",
      },
    ]);

    expect(csv).toContain("System,Risk,Impact,Owner");
    expect(csv).toContain("PHI exposure");
    expect(csv).not.toContain("Ignore me");
    expect(csv).toContain("yes");
  });
});
