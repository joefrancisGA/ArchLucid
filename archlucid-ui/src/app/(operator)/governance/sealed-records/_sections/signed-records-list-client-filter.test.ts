import { afterEach, describe, expect, it, vi } from "vitest";

import type { SignedRecordsListRow } from "./signed-records-list-row";
import { filterSignedRecordsListRows } from "./signed-records-list-client-filter";

const sampleRow: SignedRecordsListRow = {
  runId: "run-1",
  reviewTitle: "Claims modernization",
  committedUtc: "2026-03-20T16:45:00.000Z",
  manifestVersion: "2.4.1",
  manifestId: "manifest-1",
  reviewHref: "/architecture/reviews/run-1",
  signedRecordHref: "/governance/sealed-records/manifest-1",
  sealIntegrity: { kind: "ready", label: "Finalized" },
  sealDigestTruncated: "sha256-d…34567890",
  sealDigestFull: "sha256-deadbeef",
  recordLookupFailure: null,
};

describe("filterSignedRecordsListRows", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("filters by search query and integrity state on the loaded page", () => {
    const unavailableRow: SignedRecordsListRow = {
      ...sampleRow,
      runId: "run-2",
      reviewTitle: "Payments core",
      sealIntegrity: null,
      recordLookupFailure: "summary-unavailable",
    };

    expect(filterSignedRecordsListRows([sampleRow, unavailableRow], "claims", "all")).toEqual([sampleRow]);
    expect(filterSignedRecordsListRows([sampleRow, unavailableRow], "", "unavailable")).toEqual([unavailableRow]);
  });

  it("uses the UTC day for a sealed record whose timestamp omits an offset", () => {
    vi.stubEnv("TZ", "America/New_York");
    const lateUtc = { ...sampleRow, committedUtc: "2026-03-20T23:45:00" };

    expect(filterSignedRecordsListRows([lateUtc], "", "all", null, null, "2026-03-20", "2026-03-20"))
      .toEqual([lateUtc]);
  });

  it("uses UTC when comparing an offsetless seal timestamp with a rolling cutoff", () => {
    vi.stubEnv("TZ", "America/New_York");
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-03-27T12:00:00Z"));
    const beforeCutoff = { ...sampleRow, committedUtc: "2026-03-20T11:45:00" };
    const afterCutoff = { ...sampleRow, runId: "run-2", committedUtc: "2026-03-20T12:15:00" };

    expect(filterSignedRecordsListRows([beforeCutoff, afterCutoff], "", "all", null, "7d"))
      .toEqual([afterCutoff]);
  });
});
