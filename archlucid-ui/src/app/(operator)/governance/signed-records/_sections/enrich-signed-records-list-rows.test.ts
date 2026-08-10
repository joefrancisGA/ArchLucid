import { beforeEach, describe, expect, it, vi } from "vitest";

const getManifestSummary = vi.fn();
const resolveGoldenManifestIdForRun = vi.fn();

vi.mock("@/lib/api", () => ({
  getManifestSummary: (...args: unknown[]) => getManifestSummary(...args),
}));

vi.mock("@/lib/resolve-golden-manifest-id-for-run", () => ({
  resolveGoldenManifestIdForRun: (...args: unknown[]) => resolveGoldenManifestIdForRun(...args),
}));

import { enrichSignedRecordsListRows } from "./enrich-signed-records-list-rows";
import type { SignedRecordsListRow } from "./signed-records-list-row";

const baseRow: SignedRecordsListRow = {
  runId: "00000000-0000-0000-0000-000000000099",
  reviewTitle: "Claims modernization",
  committedUtc: "2026-01-15T12:00:00.000Z",
  manifestVersion: "—",
  manifestId: null,
  reviewHref: "/architecture/reviews/00000000-0000-0000-0000-000000000099",
  signedRecordHref: null,
};

beforeEach(() => {
  getManifestSummary.mockReset();
  resolveGoldenManifestIdForRun.mockReset();
});

describe("enrichSignedRecordsListRows", () => {
  it("skips resolveGoldenManifestIdForRun when manifestId is already set", async () => {
    getManifestSummary.mockResolvedValue({
      manifestId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      runId: baseRow.runId,
      createdUtc: "2026-01-16T09:00:00.000Z",
      manifestHash: "hash",
      ruleSetId: "rules",
      ruleSetVersion: "2.1.0",
      status: "Committed",
      decisionCount: 1,
      warningCount: 0,
      unresolvedIssueCount: 0,
    });

    const rows = await enrichSignedRecordsListRows([
      {
        ...baseRow,
        manifestId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        signedRecordHref: "/governance/signed-records/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      },
    ]);

    expect(resolveGoldenManifestIdForRun).not.toHaveBeenCalled();
    expect(getManifestSummary).toHaveBeenCalledWith("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    expect(rows[0]?.manifestVersion).toBe("2.1.0");
    expect(rows[0]?.committedUtc).toBe("2026-01-16T09:00:00.000Z");
  });

  it("resolves manifest id when the list row did not include it", async () => {
    resolveGoldenManifestIdForRun.mockResolvedValue("bbbbbbbb-cccc-dddd-eeee-ffffffffffff");
    getManifestSummary.mockResolvedValue({
      manifestId: "bbbbbbbb-cccc-dddd-eeee-ffffffffffff",
      runId: baseRow.runId,
      createdUtc: baseRow.committedUtc,
      manifestHash: "hash",
      ruleSetId: "rules",
      ruleSetVersion: "1.0.0",
      status: "Committed",
      decisionCount: 1,
      warningCount: 0,
      unresolvedIssueCount: 0,
    });

    const rows = await enrichSignedRecordsListRows([baseRow]);

    expect(resolveGoldenManifestIdForRun).toHaveBeenCalledWith(baseRow.runId);
    expect(rows[0]?.manifestId).toBe("bbbbbbbb-cccc-dddd-eeee-ffffffffffff");
    expect(rows[0]?.signedRecordHref).toBe(
      "/governance/signed-records/bbbbbbbb-cccc-dddd-eeee-ffffffffffff",
    );
  });
});
