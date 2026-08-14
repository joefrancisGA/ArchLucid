import { beforeEach, describe, expect, it, vi } from "vitest";

const resolveGoldenManifestIdForRun = vi.fn();

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
  resolveGoldenManifestIdForRun.mockReset();
});

describe("enrichSignedRecordsListRows", () => {
  it("skips resolveGoldenManifestIdForRun when manifestId is already set", async () => {
    const rows = await enrichSignedRecordsListRows([
      {
        ...baseRow,
        manifestVersion: "2.1.0",
        manifestId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        signedRecordHref: "/governance/sealed-records/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      },
    ]);

    expect(resolveGoldenManifestIdForRun).not.toHaveBeenCalled();
    expect(rows[0]?.manifestVersion).toBe("2.1.0");
    expect(rows[0]?.committedUtc).toBe("2026-01-15T12:00:00.000Z");
  });

  it("resolves manifest id when the list row did not include it", async () => {
    resolveGoldenManifestIdForRun.mockResolvedValue("bbbbbbbb-cccc-dddd-eeee-ffffffffffff");

    const rows = await enrichSignedRecordsListRows([baseRow]);

    expect(resolveGoldenManifestIdForRun).toHaveBeenCalledWith(baseRow.runId);
    expect(rows[0]?.manifestId).toBe("bbbbbbbb-cccc-dddd-eeee-ffffffffffff");
    expect(rows[0]?.signedRecordHref).toBe(
      "/governance/sealed-records/bbbbbbbb-cccc-dddd-eeee-ffffffffffff",
    );
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
