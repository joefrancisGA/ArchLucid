import { describe, expect, it } from "vitest";

import type { ArchitectureRiskRegisterEntry } from "@/lib/api/governance-stickiness-api";
import { matchesRiskRegisterFilter } from "@/lib/architecture/architecture-risk-register-page";

import { ARCHITECTURE_RISK_REGISTER_OWNER_NOT_STORED } from "@/lib/architecture/architecture-risk-register-csv";

import {
  GOVERNANCE_QUEUE_DECISION_STATUS_NOT_STORED,
  GOVERNANCE_QUEUE_FINDING_STATUS_NOT_STORED,
  GOVERNANCE_QUEUE_CATEGORY_NOT_STORED,
  GOVERNANCE_QUEUE_FINDING_TITLE_NOT_STORED,
  GOVERNANCE_QUEUE_RECOMMENDED_ACTION_NOT_STORED,
  GOVERNANCE_QUEUE_DECISION_RATIONALE_NOT_STORED,
  GOVERNANCE_QUEUE_REVIEW_NAME_NOT_STORED,
  GOVERNANCE_QUEUE_RULE_ID_NOT_STORED,
  GOVERNANCE_QUEUE_SEVERITY_NOT_STORED,
  GOVERNANCE_QUEUE_RATIONALE_NOT_STORED,
} from "./governance-findings-row-omission-copy";
import {
  dedupeGovernanceFindingRows,
  decisionRegisterRows,
  riskRegisterRows,
  traceRowsForRun,
} from "./governance-findings-row-mappers";
import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

describe("dedupeGovernanceFindingRows", () => {
  it("collapses rows that differ only by surrounding run-id padding", () => {
    const base: GovernanceFindingQueueRow = {
      runId: "run-1",
      runLabel: "Review",
      manifestId: "",
      findingId: "finding-1",
      title: "Risk",
      severity: "High",
      category: "Security",
      status: "Open",
      recommended: "Review.",
      recordKind: "finding",
    };

    expect(dedupeGovernanceFindingRows([base, { ...base, runId: " run-1 " }])).toHaveLength(1);
  });
});

describe("riskRegisterRows", () => {
  it("drops risk-register entries without a finding id before queue selection", () => {
    const entry = {
      findingId: undefined,
      runId: "run-1",
      manifestId: "manifest-1",
      title: "Malformed finding",
      severity: "High",
      category: "Privacy",
      statusLabel: "Open",
      agingDays: 1,
      isStale: false,
      evidenceHref: "/graph?runId=run-1",
    } as unknown as ArchitectureRiskRegisterEntry;

    expect(riskRegisterRows([entry])).toEqual([]);
  });

  it("normalizes surrounding whitespace from risk-register finding ids", () => {
    const entry = {
      findingId: " finding-1 ",
      runId: "run-1",
      manifestId: "manifest-1",
      title: "Whitespace finding",
      severity: "High",
      category: "Privacy",
      statusLabel: "Open",
      agingDays: 1,
      isStale: false,
      evidenceHref: "/graph?runId=run-1",
    } as unknown as ArchitectureRiskRegisterEntry;

    expect(riskRegisterRows([entry])[0]?.findingId).toBe("finding-1");
  });

  it("drops decision-register entries without a decision id before queue rendering", () => {
    const entry = {
      decisionId: undefined,
      manifestId: undefined,
      runId: undefined,
      category: undefined,
      title: undefined,
      selectedOption: undefined,
      rationale: undefined,
      recordedAtUtc: undefined,
    } as unknown as Parameters<typeof decisionRegisterRows>[0][number];

    expect(() => decisionRegisterRows([entry])).not.toThrow();
    expect(decisionRegisterRows([entry])).toEqual([]);
  });

  it("normalizes optional risk-register text fields before queue filtering", () => {
    const entry = {
      findingId: "finding-2",
      runId: "run-2",
      manifestId: "manifest-2",
      title: undefined,
      severity: undefined,
      category: undefined,
      statusLabel: undefined,
      agingDays: 1,
      isStale: false,
      evidenceHref: "",
    } as unknown as ArchitectureRiskRegisterEntry;

    const [row] = riskRegisterRows([entry]);

    expect(row?.status).toBe(GOVERNANCE_QUEUE_FINDING_STATUS_NOT_STORED);
    expect(row?.title).toBe(GOVERNANCE_QUEUE_FINDING_TITLE_NOT_STORED);
    expect(row?.severity).toBe(GOVERNANCE_QUEUE_SEVERITY_NOT_STORED);
    expect(() => (row === undefined ? false : matchesRiskRegisterFilter(row, "open"))).not.toThrow();
  });

  it("labels omitted human review status when stored flag is false (P-11)", () => {
    const [row] = riskRegisterRows([
      {
        findingId: "finding-hr",
        runId: "run-1",
        manifestId: "manifest-1",
        title: "Review gap",
        severity: "High",
        category: "Security",
        statusLabel: "Open",
        agingDays: 1,
        isStale: false,
        evidenceHref: "/graph?runId=run-1",
        humanReviewStatus: null,
        humanReviewStatusStored: false,
      } as ArchitectureRiskRegisterEntry,
    ]);

    expect(row?.humanReviewStatusLabel).toBe("Human review status was not stored");
  });

  it("labels missing risk-register category without blank CSV cells (P-14)", () => {
    const [row] = riskRegisterRows([
      {
        findingId: "finding-category",
        runId: "run-1",
        manifestId: "manifest-1",
        title: "Category gap",
        severity: "High",
        category: "",
        statusLabel: "Open",
        agingDays: 1,
        isStale: false,
        evidenceHref: "/graph?runId=run-1",
      } as ArchitectureRiskRegisterEntry,
    ]);

    expect(row?.category).toBe(GOVERNANCE_QUEUE_CATEGORY_NOT_STORED);
  });

  it("labels missing risk-register owners without unassigned (P-06)", () => {
    const [row] = riskRegisterRows([
      {
        findingId: "finding-owner",
        runId: "run-1",
        manifestId: "manifest-1",
        title: "Owner gap",
        severity: "High",
        category: "Privacy",
        statusLabel: "Open",
        latestDisposition: "Accepted",
        ownerUserId: null,
        agingDays: 1,
        isStale: false,
        evidenceHref: "/graph?runId=run-1",
      } as ArchitectureRiskRegisterEntry,
    ]);

    expect(row?.recommended).toContain(ARCHITECTURE_RISK_REGISTER_OWNER_NOT_STORED);
  });

  it("labels decision rows without inventing Info severity (P-08)", () => {
    const [row] = decisionRegisterRows([
      {
        decisionId: "decision-1",
        runId: "run-1",
        manifestId: "manifest-1",
        title: "Choose a pattern",
        category: "Architecture",
        rationale: "",
        selectedOption: "",
        recordedAtUtc: "2026-01-01T00:00:00.000Z",
      },
    ]);

    expect(row?.severity).toBe(GOVERNANCE_QUEUE_SEVERITY_NOT_STORED);
    expect(row?.status).toBe(GOVERNANCE_QUEUE_DECISION_STATUS_NOT_STORED);
  });

  it("does not invent trace severity, status, title, or rule id (P-01–P-04)", () => {
    const rows = traceRowsForRun(
      { runId: "run-3", projectId: "project-3", createdUtc: "2026-10-11T00:00:00.000Z" },
      [
        {
          findingId: "finding-3",
          findingTitle: "",
          ruleId: "   ",
          traceConfidenceLabel: "High confidence",
          evidenceRefCount: 2,
        },
      ],
    );

    expect(rows[0]?.severity).toBe(GOVERNANCE_QUEUE_SEVERITY_NOT_STORED);
    expect(rows[0]?.status).toBe(GOVERNANCE_QUEUE_FINDING_STATUS_NOT_STORED);
    expect(rows[0]?.title).toBe(GOVERNANCE_QUEUE_FINDING_TITLE_NOT_STORED);
    expect(rows[0]?.category).toBe(GOVERNANCE_QUEUE_CATEGORY_NOT_STORED);
    expect(rows[0]?.evidenceRefCount).toBe(2);
  });

  it("labels missing review names without Not returned (P-17)", () => {
    const [riskRow] = riskRegisterRows([
      {
        findingId: "finding-review",
        runId: "",
        manifestId: "manifest-1",
        title: "Risk",
        severity: "High",
        category: "Privacy",
        statusLabel: "Open",
        agingDays: 1,
        isStale: false,
        evidenceHref: "",
      } as ArchitectureRiskRegisterEntry,
    ]);

    expect(riskRow?.runLabel).toBe(GOVERNANCE_QUEUE_REVIEW_NAME_NOT_STORED);
  });

  it("does not fake evidence ref count from href alone (P-07)", () => {
    const [row] = riskRegisterRows([
      {
        findingId: "finding-evidence",
        runId: "run-1",
        manifestId: "manifest-1",
        title: "Risk",
        severity: "High",
        category: "Privacy",
        statusLabel: "Open",
        agingDays: 1,
        isStale: false,
        evidenceHref: "/graph?runId=run-1",
      } as ArchitectureRiskRegisterEntry,
    ]);

    expect(row?.evidenceRefCount).toBeNull();
  });

  it("normalizes padded run ids on trace-backed queue rows", () => {
    const [row] = traceRowsForRun(
      { runId: " run-trace ", projectId: "project-trace", createdUtc: "2026-10-11T00:00:00.000Z" },
      [
        {
          findingId: "finding-trace",
          findingTitle: "Trace finding",
          ruleId: "sc-28",
          traceConfidenceLabel: "High confidence",
          evidenceRefCount: 1,
        },
      ],
    );

    expect(row?.runId).toBe("run-trace");
  });

  it("labels risk rows without disposition using recommended-action omission copy (P-03)", () => {
    const [row] = riskRegisterRows([
      {
        findingId: "finding-reco",
        runId: "run-1",
        manifestId: "manifest-1",
        title: "Risk",
        severity: "High",
        category: "Privacy",
        statusLabel: "Open",
        latestDisposition: null,
        agingDays: 1,
        isStale: false,
        evidenceHref: "/graph?runId=run-1",
      } as ArchitectureRiskRegisterEntry,
    ]);

    expect(row?.recommended).toContain("Latest disposition was not stored.");
    expect(row?.recommended).toContain("Owner:");
    expect(row?.policyRuleId).toBeNull();
  });

  it("surfaces stored selected option when decision rationale was not stored (P-19)", () => {
    const [row] = decisionRegisterRows([
      {
        decisionId: "decision-selected",
        runId: "run-1",
        manifestId: "manifest-1",
        title: "Choose a pattern",
        category: "Architecture",
        rationale: "",
        selectedOption: "Private endpoints",
        recordedAtUtc: "2026-01-01T00:00:00.000Z",
      },
    ]);

    expect(row?.recommended).toBe(
      "Selected: Private endpoints. Decision rationale was stored empty.",
    );
  });

  it("labels decision rows without rationale using omission copy and omits signed-record href (P-04)", () => {
    const [row] = decisionRegisterRows([
      {
        decisionId: "decision-1",
        runId: "run-1",
        manifestId: "",
        title: "Choose a pattern",
        category: "Architecture",
        rationale: "",
        selectedOption: "",
        recordedAtUtc: "2026-01-01T00:00:00.000Z",
        supportingFindingIds: [],
      },
    ]);

    expect(row?.recommended).toBe(GOVERNANCE_QUEUE_DECISION_RATIONALE_NOT_STORED);
    expect(row?.evidenceHref).toBeUndefined();
  });

  it("labels trace rows without rule id using recommended-action omission copy (P-05)", () => {
    const rows = traceRowsForRun(
      { runId: "run-3", projectId: "project-3", createdUtc: "2026-10-11T00:00:00.000Z" },
      [{ findingId: "finding-3", findingTitle: "Title", ruleId: "", traceConfidenceLabel: "High confidence" }],
    );

    expect(rows[0]?.recommended).toBe(GOVERNANCE_QUEUE_RECOMMENDED_ACTION_NOT_STORED);
  });

  it("labels empty risk-register categories for queue export (P-17)", () => {
    const [row] = riskRegisterRows([
      {
        findingId: "finding-category",
        runId: "run-1",
        manifestId: "manifest-1",
        title: "Risk",
        severity: "High",
        category: "",
        statusLabel: "Open",
        agingDays: 1,
        isStale: false,
        evidenceHref: "",
      } as ArchitectureRiskRegisterEntry,
    ]);

    expect(row?.category).toBe(GOVERNANCE_QUEUE_CATEGORY_NOT_STORED);
  });

  it("labels stale risk rows with missing status (P-16)", () => {
    const [row] = riskRegisterRows([
      {
        findingId: "finding-stale",
        runId: "run-1",
        manifestId: "manifest-1",
        title: "Risk",
        severity: "High",
        category: "Privacy",
        statusLabel: "",
        agingDays: 1,
        isStale: true,
        evidenceHref: "",
      } as ArchitectureRiskRegisterEntry,
    ]);

    expect(row?.status).toBe(`${GOVERNANCE_QUEUE_FINDING_STATUS_NOT_STORED} · stale`);
  });
});
