import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunDetailEvidenceInventorySection } from "@/components/runs/RunDetailEvidenceInventorySection";
import { REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import type { RunDetailEvidenceInventoryItem } from "@/lib/runs/run-detail-evidence-inventory";

vi.mock("@/hooks/use-run-stored-evidence-catalog-query", () => ({
  useRunStoredEvidenceCatalogQuery: () => ({
    catalog: [
      {
        evidenceItemId: "abc123",
        originalFileName: "network-topology.png",
        contentType: "image/png",
      },
    ],
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("@/lib/runs/run-stored-evidence-file-api", () => ({
  downloadRunStoredEvidenceFile: vi.fn(),
  fetchRunStoredEvidenceFileBlob: vi.fn(),
}));

function renderWithQuery(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const storedFileItem: RunDetailEvidenceInventoryItem = {
  key: "network-topology.png",
  sourceName: "network-topology.png",
  kind: "Document",
  inventoryKind: "citation",
  evidenceItemId: null,
  ingestedUtc: "2026-08-09T12:00:00Z",
  citingFindingCount: 0,
};

const citationItem: RunDetailEvidenceInventoryItem = {
  key: "storageaccount.bicep",
  sourceName: "storageAccount.bicep",
  kind: "Infrastructure as code",
  inventoryKind: "citation",
  evidenceItemId: null,
  ingestedUtc: "2026-08-09T12:00:00Z",
  citingFindingCount: 1,
};

describe("RunDetailEvidenceInventorySection", () => {
  it("shows upload guidance for in-progress reviews", () => {
    renderWithQuery(<RunDetailEvidenceInventorySection runId="run-1" items={[]} hasManifest={false} />);

    expect(screen.getByText(/Upload supporting files or add architecture context/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Start a new review" })).not.toBeInTheDocument();
  });

  it("explains sealed records and links to a new review for committed packages", () => {
    renderWithQuery(<RunDetailEvidenceInventorySection runId="run-1" items={[]} hasManifest />);

    expect(screen.getByText(/finalized review record is locked/i)).toBeInTheDocument();
    expect(screen.queryByText(/Upload supporting files/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start a new review" })).toHaveAttribute("href", REVIEWS_NEW_PATH);
  });

  it("demotes start-new-review CTA when Do this next owns the page primary", () => {
    renderWithQuery(
      <RunDetailEvidenceInventorySection runId="run-1" items={[]} hasManifest pagePrimaryOwnedElsewhere />,
    );

    expect(screen.getByRole("link", { name: "Start a new review" }).className).toContain("border-neutral-300");
  });

  it("renders open and download controls for stored catalog files only", () => {
    renderWithQuery(
      <RunDetailEvidenceInventorySection runId="run-1" items={[storedFileItem, citationItem]} hasManifest={false} />,
    );

    expect(screen.getByRole("button", { name: "network-topology.png" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download network-topology.png" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Download storageAccount.bicep" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Download sealed review record/i)).not.toBeInTheDocument();
  });

  it("keeps citation rows as plain text", () => {
    renderWithQuery(
      <RunDetailEvidenceInventorySection runId="run-1" items={[citationItem]} hasManifest={false} />,
    );

    expect(screen.getByText("Cited — original not stored")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Download/i })).not.toBeInTheDocument();
  });
});
