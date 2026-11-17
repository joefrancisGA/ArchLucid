import { afterEach, describe, expect, it } from "vitest";

import type { SignedRecordsListRow } from "@/app/(operator)/governance/sealed-records/_sections/signed-records-list-row";
import { OPERATOR_RECENT_VIEWS_STORAGE_KEY } from "@/lib/operator/operator-recent-views";
import { resolveContinueLastSignedRecordsListRow } from "@/lib/resolve-continue-last-signed-record";

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

describe("resolveContinueLastSignedRecordsListRow", () => {
  afterEach(() => window.localStorage.removeItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY));

  it("returns null when input is not an array", () => {
    expect(resolveContinueLastSignedRecordsListRow(null)).toBeNull();
    expect(resolveContinueLastSignedRecordsListRow({})).toBeNull();
    expect(resolveContinueLastSignedRecordsListRow("nope")).toBeNull();
    expect(resolveContinueLastSignedRecordsListRow([])).toBeNull();
  });

  it("prefers the most recently committed openable row when no recent view exists", () => {
    const match = resolveContinueLastSignedRecordsListRow([
      row({ runId: "run-old", manifestId: "manifest-old", committedUtc: "2025-01-01T00:00:00Z" }),
      row({ runId: "run-new", manifestId: "manifest-new", committedUtc: "2026-02-01T00:00:00Z" }),
    ]);

    expect(match?.runId).toBe("run-new");
  });

  it("resumes the next viewed record when the most recent is outside the loaded list", () => {
    window.localStorage.setItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY, JSON.stringify({
      schemaVersion: 2,
      entries: [
        { href: "/governance/sealed-records/off-page", label: "Off page", kind: "manifest", visitedAtUtc: "2026-03-02T00:00:00Z" },
        { href: "/governance/sealed-records/manifest-1", label: "Viewed record", kind: "manifest", visitedAtUtc: "2026-03-01T00:00:00Z" },
      ],
    }));

    const match = resolveContinueLastSignedRecordsListRow([
      row(),
      row({
        runId: "run-new",
        manifestId: "manifest-new",
        signedRecordHref: "/governance/sealed-records/manifest-new",
        committedUtc: "2026-02-01T00:00:00Z",
      }),
    ]);

    expect(match?.manifestId).toBe("manifest-1");
  });

  it("returns null when no openable rows exist", () => {
    expect(
      resolveContinueLastSignedRecordsListRow([
        row({ signedRecordHref: null, manifestId: null, recordLookupFailure: "pending-resolution" }),
      ]),
    ).toBeNull();
  });
});
