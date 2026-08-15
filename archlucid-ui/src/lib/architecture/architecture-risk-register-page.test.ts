import { describe, expect, it } from "vitest";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import {
  computeArchitectureRiskRegisterSummary,
  GOVERNANCE_QUEUE_DISPOSITION_NONE_LABEL,
  governanceQueueDispositionLabel,
  matchesGovernanceFindingsRunScope,
  matchesRiskRegisterFilter,
  riskRegisterFilterFromQuery,
  scopedRunIdFromQuery,
} from "@/lib/architecture/architecture-risk-register-page";

function sampleRow(overrides: Partial<GovernanceFindingQueueRow> = {}): GovernanceFindingQueueRow {
  return {
    runId: "run-1",
    runLabel: "Claims Intake Review",
    manifestId: "manifest-1",
    findingId: "finding-1",
    title: "PHI minimization risk",
    severity: "High",
    category: "Privacy",
    status: "Open",
    recommended: "Review with security owner.",
    recordKind: "finding",
    ...overrides,
  };
}

describe("architecture-risk-register-page", () => {
  it("maps legacy waiver-expiring query param to expiring-soon filter", () => {
    expect(riskRegisterFilterFromQuery("waiver-expiring")).toBe("expiring-soon");
    expect(riskRegisterFilterFromQuery("no-owner")).toBe("no-owner");
  });

  it("scopes findings queue rows by runId query", () => {
    expect(scopedRunIdFromQuery("  run-abc  ")).toBe("run-abc");
    expect(scopedRunIdFromQuery("")).toBeNull();
    expect(matchesGovernanceFindingsRunScope(sampleRow({ runId: "run-1" }), "run-1")).toBe(true);
    expect(matchesGovernanceFindingsRunScope(sampleRow({ runId: "run-1" }), "run-2")).toBe(false);
    expect(matchesGovernanceFindingsRunScope(sampleRow({ runId: "run-1" }), null)).toBe(true);
  });

  it("computes summary metrics from register rows", () => {
    const nowMs = Date.parse("2026-07-01T12:00:00.000Z");
    const summary = computeArchitectureRiskRegisterSummary(
      [
        sampleRow({ status: "Open", ownerUserId: "owner@contoso.com" }),
        sampleRow({
          findingId: "finding-2",
          ownerUserId: null,
          status: "Accepted · monitoring",
          latestDisposition: "Accepted",
        }),
        sampleRow({
          findingId: "finding-3",
          ownerUserId: "owner@contoso.com",
          waiverExpiresAtUtc: "2026-07-10T00:00:00.000Z",
        }),
        sampleRow({
          findingId: "finding-4",
          ownerUserId: "owner@contoso.com",
          revisitDueUtc: "2026-06-01T00:00:00.000Z",
        }),
      ],
      nowMs,
    );

    expect(summary).toEqual({
      openRisks: 4,
      expiringExceptions: 1,
      pendingOwner: 1,
      overdueReview: 1,
    });
  });

  it("matches operational filters from row data", () => {
    const nowMs = Date.parse("2026-07-01T12:00:00.000Z");
    const row = sampleRow({
      status: "Accepted · monitoring",
      latestDisposition: "Accepted",
      ownerUserId: "owner@contoso.com",
      waiverExpiresAtUtc: "2026-07-05T00:00:00.000Z",
      severity: "High",
    });

    expect(matchesRiskRegisterFilter(row, "accepted-risk", nowMs)).toBe(true);
    expect(matchesRiskRegisterFilter(row, "exception-granted", nowMs)).toBe(true);
    expect(matchesRiskRegisterFilter(row, "high-severity", nowMs)).toBe(true);
    expect(matchesRiskRegisterFilter(row, "no-owner", nowMs)).toBe(false);
  });

  it("matches help deep-link filters for critical/error, needs-decision, and remediations", () => {
    const nowMs = Date.parse("2026-07-01T12:00:00.000Z");

    expect(
      matchesRiskRegisterFilter(
        sampleRow({ status: "Open", severity: "Critical", latestDisposition: null }),
        "critical-error",
        nowMs,
      ),
    ).toBe(true);
    expect(
      matchesRiskRegisterFilter(
        sampleRow({ status: "Open", severity: "Warning", latestDisposition: null }),
        "critical-error",
        nowMs,
      ),
    ).toBe(false);
    expect(
      matchesRiskRegisterFilter(
        sampleRow({ status: "Open", severity: "Error", latestDisposition: null }),
        "needs-decision",
        nowMs,
      ),
    ).toBe(true);
    expect(
      matchesRiskRegisterFilter(
        sampleRow({
          status: "Closed",
          severity: "Warning",
          latestDisposition: "Remediated",
          lastReviewedUtc: "2026-06-20T12:00:00.000Z",
        }),
        "remediated-recent",
        nowMs,
      ),
    ).toBe(true);
    expect(riskRegisterFilterFromQuery("critical-error")).toBe("critical-error");
    expect(riskRegisterFilterFromQuery("needs-decision")).toBe("needs-decision");
    expect(riskRegisterFilterFromQuery("remediated-recent")).toBe("remediated-recent");
  });

  it("derives disposition label from latest disposition", () => {
    expect(
      governanceQueueDispositionLabel(
        sampleRow({ latestDisposition: "Accepted", status: "Accepted · monitoring" }),
      ),
    ).toBe("Accepted");
    expect(governanceQueueDispositionLabel(sampleRow({ recordKind: "decision" }))).toBe("Recorded decision");
  });

  /**
   * The queue shows Disposition beside Status. Falling back to the status text made both cells read
   * the same value, so an un-triaged finding looked as if a reviewer had already dispositioned it.
   */
  it("says the disposition is not recorded instead of echoing status", () => {
    expect(
      governanceQueueDispositionLabel(sampleRow({ latestDisposition: null, status: "Open · unassigned" })),
    ).toBe(GOVERNANCE_QUEUE_DISPOSITION_NONE_LABEL);
    expect(
      governanceQueueDispositionLabel(sampleRow({ latestDisposition: "   ", status: "Open" })),
    ).toBe(GOVERNANCE_QUEUE_DISPOSITION_NONE_LABEL);
  });
});
