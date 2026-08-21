import { describe, expect, it } from "vitest";

import type { ManifestSummary } from "@/types/authority";
import type { RunSummary } from "@/types/authority";

import {
  applyManifestSummaryToSignedRecordsListRow,
  buildSignedRecordsListRowsFromRuns,
  isSignedRecordsListRowOpenable,
} from "./signed-records-list-row";

const finalizedRun: RunSummary = {
  runId: "00000000-0000-0000-0000-000000000099",
  projectId: "default",
  description: "Claims modernization",
  createdUtc: "2026-01-15T12:00:00.000Z",
  hasContextSnapshot: true,
  hasGraphSnapshot: false,
  hasFindingsSnapshot: true,
  hasGoldenManifest: true,
};

const inProgressRun: RunSummary = {
  ...finalizedRun,
  runId: "00000000-0000-0000-0000-000000000088",
  hasGoldenManifest: false,
};

const manifestSummary: ManifestSummary = {
  manifestId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  runId: finalizedRun.runId,
  createdUtc: "2026-03-20T16:45:00.000Z",
  manifestHash: "sha256-demo-abcdef1234567890abcdef1234567890",
  ruleSetId: "healthcare-claims",
  ruleSetVersion: "2.4.1",
  decisionCount: 3,
  warningCount: 0,
  unresolvedIssueCount: 0,
  status: "Committed",
};

describe("buildSignedRecordsListRowsFromRuns", () => {
  it("keeps only runs with a golden manifest", () => {
    const rows = buildSignedRecordsListRowsFromRuns([finalizedRun, inProgressRun]);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.runId).toBe(finalizedRun.runId);
    expect(rows[0]?.reviewHref).toBe(`/architecture/reviews/${encodeURIComponent(finalizedRun.runId)}`);
    expect(rows[0]?.signedRecordHref).toBeNull();
    expect(isSignedRecordsListRowOpenable(rows[0]!)).toBe(false);
    expect(rows[0]?.recordLookupFailure).toBe("pending-resolution");
  });

  it("does not seed version or seal date from run summary before enrichment", () => {
    const withVersion: RunSummary = {
      ...finalizedRun,
      goldenManifestId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      currentManifestVersion: "9.9.9",
    };

    const rows = buildSignedRecordsListRowsFromRuns([withVersion]);

    expect(rows[0]?.manifestVersion).toBe(" — ");
    expect(rows[0]?.committedUtc).toBe("");
    expect(rows[0]?.manifestId).toBe("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    expect(rows[0]?.signedRecordHref).toBe(
      "/governance/sealed-records/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    );
    expect(isSignedRecordsListRowOpenable(rows[0]!)).toBe(true);
  });
});

describe("applyManifestSummaryToSignedRecordsListRow", () => {
  it("binds seal timestamp and golden manifest version from manifest summary", () => {
    const baseRow = buildSignedRecordsListRowsFromRuns([
      {
        ...finalizedRun,
        goldenManifestId: manifestSummary.manifestId,
        currentManifestVersion: "9.9.9",
        createdUtc: "2026-01-15T12:00:00.000Z",
      },
    ])[0]!;

    const enriched = applyManifestSummaryToSignedRecordsListRow(
      baseRow,
      manifestSummary,
      manifestSummary.manifestId,
    );

    expect(enriched.committedUtc).toBe("2026-03-20T16:45:00.000Z");
    expect(enriched.manifestVersion).toBe("2.4.1");
    expect(enriched.sealIntegrity?.label).toBe("Finalized");
    expect(enriched.sealDigestTruncated).toContain("sha256-d");
    expect(enriched.recordLookupFailure).toBeNull();
  });
});
