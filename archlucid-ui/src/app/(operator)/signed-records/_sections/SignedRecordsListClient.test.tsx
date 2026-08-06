import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listRunsByProjectPaged = vi.fn();
const enrichSignedRecordsListRows = vi.fn();

vi.mock("@/lib/api", () => ({
  listRunsByProjectPaged: (...args: unknown[]) => listRunsByProjectPaged(...args),
}));

vi.mock("./enrich-signed-records-list-rows", () => ({
  enrichSignedRecordsListRows: (...args: unknown[]) => enrichSignedRecordsListRows(...args),
}));

import SignedRecordsListClient from "./SignedRecordsListClient";

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

beforeEach(() => {
  listRunsByProjectPaged.mockReset();
  enrichSignedRecordsListRows.mockReset();
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
        runId: row.runId,
        reviewTitle: "Claims modernization",
        committedUtc: finalizedRun.createdUtc,
        manifestVersion: "1.0.0",
        manifestId: "manifest-abc",
        reviewHref: `/architecture/reviews/${row.runId}`,
        signedRecordHref: `/governance/signed-records/manifest-abc`,
      })),
    );

    render(<SignedRecordsListClient />);

    expect(screen.getByTestId("signed-records-list-page-title")).toHaveTextContent("Signed review records");

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Claims modernization" })).toBeInTheDocument();
    });

    expect(listRunsByProjectPaged).toHaveBeenCalled();
    const listOptions = listRunsByProjectPaged.mock.calls[0]?.[3] as Record<string, unknown> | undefined;
    expect(listOptions?.includeArchived).toBeUndefined();

    expect(screen.getByRole("link", { name: "Open signed record" })).toHaveAttribute(
      "href",
      "/governance/signed-records/manifest-abc",
    );
  });

  it("shows record unavailable honesty when enrich leaves signedRecordHref null (TB-1943)", async () => {
    listRunsByProjectPaged.mockResolvedValue({
      items: [finalizedRun],
      totalCount: 1,
      page: 1,
      pageSize: 100,
      hasMore: false,
    });
    enrichSignedRecordsListRows.mockImplementation(async (rows: readonly { runId: string; reviewHref: string }[]) =>
      rows.map((row) => ({
        runId: row.runId,
        reviewTitle: "Claims modernization",
        committedUtc: finalizedRun.createdUtc,
        manifestVersion: "—",
        manifestId: null,
        reviewHref: row.reviewHref,
        signedRecordHref: null,
      })),
    );

    render(<SignedRecordsListClient />);

    await waitFor(() => {
      expect(screen.getByText("Record unavailable")).toBeInTheDocument();
    });

    expect(screen.queryByRole("link", { name: "Open signed record" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open review" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("shows an empty state when no finalized runs exist", async () => {
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
      expect(screen.getByText("No signed review records yet")).toBeInTheDocument();
    });
  });
});
