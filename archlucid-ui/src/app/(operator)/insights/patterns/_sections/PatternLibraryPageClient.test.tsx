import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PatternLibraryPageClient } from "./PatternLibraryPageClient";
import {
  PATTERN_LIBRARY_EMPTY_BUILDING_BODY,
  PATTERN_LIBRARY_EMPTY_BUILDING_TITLE,
  PATTERN_LIBRARY_PAGE_SUBTITLE,
} from "@/lib/pattern-library-copy";

function renderWithQueryClient(ui: React.ReactElement): void {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("PatternLibraryPageClient", () => {
  it("renders below-threshold empty state for buyer-polished workspaces", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify([]),
      })) as unknown as typeof fetch,
    );

    renderWithQueryClient(<PatternLibraryPageClient />);

    expect(screen.getByTestId("pattern-library-page-title")).toHaveTextContent("Pattern library");
    expect(screen.getByText(PATTERN_LIBRARY_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("pattern-library-provenance-badge")).toBeInTheDocument();
    expect(screen.getByTestId("pattern-library-summary-row")).toBeInTheDocument();
    expect(screen.getByTestId("pattern-library-filters")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("pattern-library-empty-state")).toBeInTheDocument();
    });

    expect(screen.getByText(PATTERN_LIBRARY_EMPTY_BUILDING_TITLE)).toBeInTheDocument();
    expect(screen.getByText(PATTERN_LIBRARY_EMPTY_BUILDING_BODY)).toBeInTheDocument();
    expect(screen.queryByTestId("pattern-library-card-grid")).not.toBeInTheDocument();
    expect(screen.queryByText(/runId/i)).not.toBeInTheDocument();
  });
});
