import { describe, expect, it } from "vitest";

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
});
