import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SignedRecordsListTable } from "./SignedRecordsListTable";
import type { SignedRecordsListRow } from "./signed-records-list-row";

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");
  return extendNextNavigationVitestMock(importOriginal);
});

const olderRecord: SignedRecordsListRow = {
  runId: "older-run",
  reviewTitle: "Older review",
  committedUtc: "2026-03-20T18:00:00",
  manifestVersion: "v1",
  manifestId: "older-manifest",
  reviewHref: "/architecture/reviews/older-run",
  signedRecordHref: "/governance/sealed-records/older-manifest",
  sealIntegrity: null,
  sealDigestTruncated: null,
  sealDigestFull: null,
  recordLookupFailure: null,
};

describe("sealed-record finalization timestamps", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses the same UTC instant for the date cell and the sort order", () => {
    vi.stubEnv("TZ", "America/New_York");
    const newerRecord = {
      ...olderRecord,
      runId: "newer-run",
      reviewTitle: "Newer review",
      committedUtc: "2026-03-20T20:00:00Z",
      manifestId: "newer-manifest",
      reviewHref: "/architecture/reviews/newer-run",
      signedRecordHref: "/governance/sealed-records/newer-manifest",
    };
    render(<SignedRecordsListTable rows={[olderRecord, newerRecord]} retryingRunId={null} onRetryRow={vi.fn()} />);

    expect(screen.getAllByRole("row").slice(1).map((row) => ({
      review: row.querySelector("td")?.textContent,
      finalized: row.querySelector("time")?.dateTime,
    }))).toEqual([
      { review: "Newer review", finalized: "2026-03-20T20:00:00.000Z" },
      { review: "Older review", finalized: "2026-03-20T18:00:00.000Z" },
    ]);
  });
});
