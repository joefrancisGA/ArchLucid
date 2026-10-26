import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_RISK_REGISTER_EVIDENCE_LINK_NOT_STORED,
  ARCHITECTURE_RISK_REGISTER_LAST_REVIEWED_NOT_STORED,
  ARCHITECTURE_RISK_REGISTER_OWNER_DISPLAY_NAME_NOT_STORED,
  ARCHITECTURE_RISK_REGISTER_OWNER_NOT_STORED,
  ARCHITECTURE_RISK_REGISTER_STALE_FLAG_NOT_STORED,
  buildArchitectureRiskRegisterCsv,
} from "@/lib/architecture/architecture-risk-register-csv";

describe("buildArchitectureRiskRegisterCsv", () => {
  it("maps system name column separately from category", () => {
    const csv = buildArchitectureRiskRegisterCsv([
      {
        recordKind: "finding",
        runId: "run-1",
        findingId: "f-1",
        title: "PHI exposure",
        severity: "High",
        category: "Network",
        systemName: "Claims platform",
        status: "Open",
        recommended: "Review with security owner",
      },
    ]);

    const dataLine = csv.split("\r\n")[1] ?? "";
    expect(dataLine.startsWith("Claims platform,")).toBe(true);
    expect(dataLine).toContain("PHI exposure");
  });

  it("maps last reviewed and next review columns separately from waiver expiry", () => {
    const csv = buildArchitectureRiskRegisterCsv([
      {
        recordKind: "finding",
        runId: "run-1",
        findingId: "f-1",
        title: "PHI exposure",
        severity: "High",
        category: "Claims intake",
        systemName: "Claims platform",
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

  it("does not invent inspect-path evidence URLs when href is omitted (P-06)", () => {
    const csv = buildArchitectureRiskRegisterCsv([
      {
        recordKind: "finding",
        runId: "run-1",
        findingId: "f-1",
        title: "Risk",
        severity: "High",
        category: "Claims intake",
        status: "Open",
        recommended: "Review",
        ownerUserId: "owner-1",
        agingDays: 1,
        isStale: false,
      },
    ]);

    expect(csv).toContain(ARCHITECTURE_RISK_REGISTER_EVIDENCE_LINK_NOT_STORED);
    expect(csv).not.toContain("/findings/");
  });

  it("replaces uuid owner ids with display-name omission copy", () => {
    const csv = buildArchitectureRiskRegisterCsv([
      {
        recordKind: "finding",
        runId: "run-1",
        findingId: "f-1",
        title: "Gap",
        severity: "High",
        category: "Network",
        status: "Open",
        recommended: "Review",
        ownerUserId: "550e8400-e29b-41d4-a716-446655440000",
      },
    ]);

    expect(csv).toContain(ARCHITECTURE_RISK_REGISTER_OWNER_DISPLAY_NAME_NOT_STORED);
    expect(csv).not.toContain("550e8400-e29b-41d4-a716-446655440000");
  });

  it("labels missing owner and evidence link without inventing values (P-06, P-07)", () => {
    const csv = buildArchitectureRiskRegisterCsv([
      {
        recordKind: "finding",
        runId: "",
        findingId: "f-orphan",
        title: "Orphan finding",
        severity: "High",
        category: "Claims intake",
        status: "Open",
        recommended: "Review",
        ownerUserId: null,
        agingDays: 0,
        isStale: false,
      },
    ]);

    expect(csv).toContain(ARCHITECTURE_RISK_REGISTER_OWNER_NOT_STORED);
    expect(csv).toContain(ARCHITECTURE_RISK_REGISTER_EVIDENCE_LINK_NOT_STORED);
    expect(csv).not.toContain("f-orphan,");
  });

  it("does not treat omitted stale flag as no", () => {
    const csv = buildArchitectureRiskRegisterCsv([
      {
        recordKind: "finding",
        runId: "run-1",
        findingId: "f-1",
        title: "Stale unknown",
        severity: "Medium",
        category: "Claims intake",
        status: "Open",
        recommended: "Review",
      },
    ]);

    expect(csv).toContain(ARCHITECTURE_RISK_REGISTER_STALE_FLAG_NOT_STORED);
    expect(csv).not.toMatch(/,no,\r?\n/);
  });

  it("labels missing last reviewed without a blank cell", () => {
    const csv = buildArchitectureRiskRegisterCsv([
      {
        recordKind: "finding",
        runId: "run-1",
        findingId: "f-1",
        title: "Never reviewed",
        severity: "Low",
        category: "Claims intake",
        status: "Open",
        recommended: "Review",
        isStale: false,
      },
    ]);

    expect(csv).toContain(ARCHITECTURE_RISK_REGISTER_LAST_REVIEWED_NOT_STORED);
  });
});
