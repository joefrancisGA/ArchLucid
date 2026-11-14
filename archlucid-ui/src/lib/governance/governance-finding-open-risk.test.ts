import { describe, expect, it } from "vitest";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { GOVERNANCE_QUEUE_FINDING_STATUS_NOT_STORED } from "@/components/governance/findings/governance-findings-row-omission-copy";
import { isGovernanceFindingOpenRisk } from "@/lib/governance/governance-finding-open-risk";

function findingRow(status: string): GovernanceFindingQueueRow {
  return {
    recordKind: "finding",
    runId: "run-1",
    runLabel: "Review",
    manifestId: "",
    findingId: "finding-1",
    title: "Gap",
    severity: "High",
    category: "Network",
    status,
    recommended: "",
    traceConfidenceLevel: null,
    ownerUserId: null,
    latestDisposition: null,
    agingDays: 1,
    waiverExpiresAtUtc: null,
    lastReviewedUtc: null,
    revisitDueUtc: null,
    isStale: false,
    evidenceHref: null,
    evidenceRefCount: null,
    humanReviewStatusLabel: null,
    itsmLinkedTicketsSummary: null,
    systemName: null,
    policyRuleId: null,
  };
}

describe("isGovernanceFindingOpenRisk", () => {
  it("does not count unknown stored status omission as open", () => {
    expect(isGovernanceFindingOpenRisk(findingRow(GOVERNANCE_QUEUE_FINDING_STATUS_NOT_STORED))).toBe(false);
  });

  it("counts actionable open statuses", () => {
    expect(isGovernanceFindingOpenRisk(findingRow("Open · stale"))).toBe(true);
  });
});