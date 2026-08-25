import { describe, expect, it } from "vitest";

import { resolveNextSignedRecordsListRow } from "@/lib/resolve-next-signed-records-list-row";
import type { SignedRecordsListRow } from "@/app/(operator)/governance/sealed-records/_sections/signed-records-list-row";

function row(overrides: Partial<SignedRecordsListRow> = {}): SignedRecordsListRow {
  return {
    runId: "run-1",
    reviewTitle: "Q1 review",
    committedUtc: "2026-01-01T00:00:00Z",
    manifestVersion: "v1",
    manifestId: "manifest-1",
    reviewHref: "/architecture/reviews/run-1",
    signedRecordHref: "/governance/sealed-records/manifest-1",
    sealIntegrity: null,
    sealDigestTruncated: null,
    sealDigestFull: null,
    recordLookupFailure: null,
    ...overrides,
  };
}

describe("resolveNextSignedRecordsListRow", () => {
  it("returns the next openable record after the current manifest", () => {
    const next = resolveNextSignedRecordsListRow(
      [
        row({ manifestId: "manifest-1", signedRecordHref: "/governance/sealed-records/manifest-1" }),
        row({
          runId: "run-2",
          manifestId: "manifest-2",
          signedRecordHref: "/governance/sealed-records/manifest-2",
          reviewTitle: "Q2 review",
        }),
      ],
      "manifest-1",
    );

    expect(next?.manifestId).toBe("manifest-2");
    expect(next?.href).toBe("/governance/sealed-records/manifest-2");
  });
});
