import { beforeEach, describe, expect, it, vi } from "vitest";

const resolveGoldenManifestIdForRun = vi.fn();
const getManifestSummary = vi.fn();
const tryStaticDemoManifestSummary = vi.fn();

vi.mock("@/lib/resolve-golden-manifest-id-for-run", () => ({
  resolveGoldenManifestIdForRun: (...args: unknown[]) => resolveGoldenManifestIdForRun(...args),
}));

vi.mock("@/lib/api", () => ({
  getManifestSummary: (...args: unknown[]) => getManifestSummary(...args),
}));

vi.mock("@/lib/operator/operator-static-demo", () => ({
  tryStaticDemoManifestSummary: (...args: unknown[]) => tryStaticDemoManifestSummary(...args),
}));

import { enrichSignedRecordsListRows } from "./enrich-signed-records-list-rows";
import type { SignedRecordsListRow } from "./signed-records-list-row";

const baseRow: SignedRecordsListRow = {
  runId: "00000000-0000-0000-0000-000000000099",
  reviewTitle: "Claims modernization",
  committedUtc: "",
  manifestVersion: " — ",
  manifestId: null,
  reviewHref: "/architecture/reviews/00000000-0000-0000-0000-000000000099",
  signedRecordHref: null,
  sealIntegrity: null,
  sealDigestTruncated: null,
  sealDigestFull: null,
  recordLookupFailure: "pending-resolution",
};

const manifestSummary = {
  manifestId: "bbbbbbbb-cccc-dddd-eeee-ffffffffffff",
  runId: baseRow.runId,
  createdUtc: "2026-03-20T16:45:00.000Z",
  manifestHash: "sha256-demo-abcdef1234567890abcdef1234567890",
  ruleSetId: "healthcare-claims",
  ruleSetVersion: "2.4.1",
  decisionCount: 3,
  warningCount: 0,
  unresolvedIssueCount: 0,
  status: "Committed",
};

beforeEach(() => {
  resolveGoldenManifestIdForRun.mockReset();
  getManifestSummary.mockReset();
  tryStaticDemoManifestSummary.mockReset();
  tryStaticDemoManifestSummary.mockReturnValue(null);
});

describe("enrichSignedRecordsListRows", () => {
  it("fetches manifest summary even when manifestId is already set", async () => {
    getManifestSummary.mockResolvedValue(manifestSummary);

    const rows = await enrichSignedRecordsListRows([
      {
        ...baseRow,
        manifestId: manifestSummary.manifestId,
        signedRecordHref: `/governance/sealed-records/${manifestSummary.manifestId}`,
        recordLookupFailure: null,
      },
    ]);

    expect(resolveGoldenManifestIdForRun).not.toHaveBeenCalled();
    expect(getManifestSummary).toHaveBeenCalledWith(manifestSummary.manifestId);
    expect(rows[0]?.committedUtc).toBe("2026-03-20T16:45:00.000Z");
    expect(rows[0]?.manifestVersion).toBe("2.4.1");
    expect(rows[0]?.sealIntegrity?.label).toBe("Sealed");
  });

  it("resolves manifest id and summary when the list row did not include them", async () => {
    resolveGoldenManifestIdForRun.mockResolvedValue(manifestSummary.manifestId);
    getManifestSummary.mockResolvedValue(manifestSummary);

    const rows = await enrichSignedRecordsListRows([baseRow]);

    expect(resolveGoldenManifestIdForRun).toHaveBeenCalledWith(baseRow.runId);
    expect(rows[0]?.manifestId).toBe(manifestSummary.manifestId);
    expect(rows[0]?.signedRecordHref).toBe(
      "/governance/sealed-records/bbbbbbbb-cccc-dddd-eeee-ffffffffffff",
    );
    expect(rows[0]?.recordLookupFailure).toBeNull();
  });

  it("marks rows pending resolution when manifest id cannot be resolved", async () => {
    resolveGoldenManifestIdForRun.mockResolvedValue(null);

    const rows = await enrichSignedRecordsListRows([baseRow]);

    expect(rows[0]?.recordLookupFailure).toBe("pending-resolution");
    expect(rows[0]?.signedRecordHref).toBeNull();
  });

  it("limits parallel manifest lookups to the configured concurrency ceiling (TB-1944)", async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    resolveGoldenManifestIdForRun.mockImplementation(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => {
        setTimeout(resolve, 5);
      });
      inFlight -= 1;

      return "manifest-concurrent";
    });
    getManifestSummary.mockResolvedValue(manifestSummary);

    const pendingRows = Array.from({ length: 12 }, (_, index) => ({
      ...baseRow,
      runId: `00000000-0000-0000-0000-${String(index).padStart(12, "0")}`,
      reviewHref: `/architecture/reviews/${index}`,
    }));

    await enrichSignedRecordsListRows(pendingRows);

    expect(maxInFlight).toBeLessThanOrEqual(5);
    expect(resolveGoldenManifestIdForRun).toHaveBeenCalledTimes(12);
  });
});
