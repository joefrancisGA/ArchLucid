import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listRunsByProjectPaged = vi.fn();
const enrichSignedRecordsListRows = vi.fn();
const areSpineStaticDemoPayloadsAvailable = vi.fn();

vi.mock("@/lib/api", () => ({
  listRunsByProjectPaged: (...args: unknown[]) => listRunsByProjectPaged(...args),
}));

vi.mock("@/lib/operator/operator-static-demo", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/operator/operator-static-demo")>();

  return {
    ...actual,
    areSpineStaticDemoPayloadsAvailable: (...args: unknown[]) => areSpineStaticDemoPayloadsAvailable(...args),
    tryStaticDemoRunSummariesPaged: () => null,
  };
});

vi.mock("./enrich-signed-records-list-rows", () => ({
  enrichSignedRecordsListRows: (...args: unknown[]) => enrichSignedRecordsListRows(...args),
}));

import SignedRecordsListClient from "./SignedRecordsListClient";
import { GOVERNANCE_OVERVIEW_PAGE_LEAD } from "@/lib/governance/governance-overview-copy";
import {
  SIGNED_RECORDS_LIST_LIST_LEAD,
  SIGNED_RECORDS_LIST_RECORD_PENDING_RESOLUTION,
} from "./signed-records-list-copy";

import type { RunSummary } from "@/types/authority";

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

const enrichedRow = {
  runId: finalizedRun.runId,
  reviewTitle: "Claims modernization",
  committedUtc: "2026-03-20T16:45:00.000Z",
  manifestVersion: "2.4.1",
  manifestId: "manifest-abc",
  reviewHref: `/architecture/reviews/${finalizedRun.runId}`,
  signedRecordHref: "/governance/sealed-records/manifest-abc",
  sealIntegrity: { kind: "ready" as const, label: "Sealed" },
  sealSigner: null,
  sealDigestTruncated: "sha256-d…34567890",
  recordLookupFailure: null,
};

beforeEach(() => {
  listRunsByProjectPaged.mockReset();
  enrichSignedRecordsListRows.mockReset();
  areSpineStaticDemoPayloadsAvailable.mockReturnValue(true);
});

describe("SignedRecordsListClient", () => {
  it("renders the signed-records index title and table rows for finalized runs", async () => {
    listRunsByProjectPaged.mockResolvedValue({
      items: [finalizedRun],
      totalCount: 1,
      page: 1,
      pageSize: 100,
      hasMore: false,
    });
    enrichSignedRecordsListRows.mockImplementation(async (rows: readonly { runId: string }[]) =>
      rows.map((row) => ({
        ...enrichedRow,
        runId: row.runId,
        reviewHref: `/architecture/reviews/${row.runId}`,
      })),
    );

    render(<SignedRecordsListClient />);

    expect(screen.getByTestId("signed-records-list-page-title")).toHaveTextContent("Sealed review records");
    expect(screen.queryByText(GOVERNANCE_OVERVIEW_PAGE_LEAD)).not.toBeInTheDocument();
    expect(screen.getByText(SIGNED_RECORDS_LIST_LIST_LEAD)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Claims modernization" })).toBeInTheDocument();
    });

    expect(screen.getByTestId("signed-records-list-record-count")).toHaveTextContent("1 sealed review record");

    expect(listRunsByProjectPaged).toHaveBeenCalled();
    const listOptions = listRunsByProjectPaged.mock.calls[0]?.[3] as Record<string, unknown> | undefined;
    expect(listOptions?.includeArchived).toBeUndefined();

    expect(screen.getByRole("link", { name: "Open sealed record" })).toHaveAttribute(
      "href",
      "/governance/sealed-records/manifest-abc",
    );
    expect(screen.getByTestId(`signed-record-integrity-${finalizedRun.runId}`)).toHaveTextContent("Sealed");
    expect(screen.queryAllByRole("link", { name: "Open review" })).toHaveLength(0);
  });

  it("requests keyset cursor pages of 100 runs and keeps pagination mounted while loading (TB-1944)", async () => {
    listRunsByProjectPaged.mockResolvedValue({
      items: [finalizedRun],
      requestedTake: 100,
      hasMore: true,
      nextCursor: "cursor-page-2",
    });
    enrichSignedRecordsListRows.mockImplementation(async (rows: readonly { runId: string }[]) =>
      rows.map((row) => ({
        ...enrichedRow,
        runId: row.runId,
        reviewHref: `/architecture/reviews/${row.runId}`,
      })),
    );

    render(<SignedRecordsListClient />);

    expect(screen.getByTestId("signed-records-list-pagination")).toBeInTheDocument();
    expect(screen.getByTestId("signed-records-list-loading-status")).toHaveAttribute("role", "status");
    expect(screen.getByTestId("signed-records-list-loading-status")).toHaveAttribute("aria-live", "polite");

    await waitFor(() => {
      expect(screen.getByTestId("signed-records-list-pagination-summary")).toHaveTextContent(/more available/i);
    });

    expect(listRunsByProjectPaged).toHaveBeenCalledWith(
      expect.any(String),
      1,
      100,
      expect.objectContaining({ cursor: "" }),
    );
  });

  it("shows diagnosable pending-resolution copy when enrich leaves signedRecordHref null (TB-1943)", async () => {
    listRunsByProjectPaged.mockResolvedValue({
      items: [finalizedRun],
      totalCount: 1,
      page: 1,
      pageSize: 100,
      hasMore: false,
    });
    enrichSignedRecordsListRows.mockImplementation(async (rows: readonly { runId: string; reviewHref: string }[]) =>
      rows.map((row) => ({
        ...enrichedRow,
        runId: row.runId,
        reviewHref: row.reviewHref,
        manifestVersion: "—",
        manifestId: null,
        signedRecordHref: null,
        sealIntegrity: null,
        sealDigestTruncated: null,
        recordLookupFailure: "pending-resolution" as const,
      })),
    );

    render(<SignedRecordsListClient />);

    await waitFor(() => {
      expect(screen.getByText(SIGNED_RECORDS_LIST_RECORD_PENDING_RESOLUTION)).toBeInTheDocument();
    });

    expect(screen.queryByRole("link", { name: "Open sealed record" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Claims modernization" })).toHaveAttribute(
      "href",
      `/architecture/reviews/${finalizedRun.runId}`,
    );
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("shows an honest empty state when no finalized runs exist", async () => {
    listRunsByProjectPaged.mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 100,
      hasMore: false,
    });
    enrichSignedRecordsListRows.mockResolvedValue([]);

    render(<SignedRecordsListClient />);

    await waitFor(() => {
      expect(screen.getByText("No sealed review records yet")).toBeInTheDocument();
    });

    expect(screen.getByText(/Reviews in progress are not listed here/i)).toBeInTheDocument();
    expect(screen.queryByTestId("signed-records-review-detail-vocabulary")).not.toBeInTheDocument();

    const browseReviewsLink = screen.getByRole("link", { name: "Browse reviews" });
    expect(browseReviewsLink).toHaveAttribute("href", "/architecture/reviews");
    expect(browseReviewsLink.getAttribute("href")).not.toMatch(/projectId=/i);

    expect(screen.getByRole("link", { name: "View sample sealed record" })).toBeInTheDocument();
  });
});
