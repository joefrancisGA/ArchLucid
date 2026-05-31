import { describe, expect, it } from "vitest";

import { buildArchitectureRiskRegisterCsv } from "@/lib/architecture-risk-register-csv";

describe("buildArchitectureRiskRegisterCsv", () => {
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
        evidenceHref: "/reviews/run-1/findings/f-1/inspect",
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
