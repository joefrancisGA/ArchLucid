import { render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PatternLibraryPageClient } from "@/app/(operator)/patterns/_sections/PatternLibraryPageClient";
import { PATTERN_LIBRARY_PAGE_SUBTITLE } from "@/lib/pattern-library-copy";

describe("PatternLibraryPageClient", () => {
  it("renders summary, filters, and sample pattern cards", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify([]),
      })) as unknown as typeof fetch,
    );

    render(<PatternLibraryPageClient />);

    expect(screen.getByTestId("pattern-library-page-title")).toHaveTextContent("Pattern library");
    expect(screen.getByText(PATTERN_LIBRARY_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("pattern-library-provenance-badge")).toBeInTheDocument();
    expect(screen.getByTestId("pattern-library-summary-row")).toBeInTheDocument();
    expect(screen.getByTestId("pattern-library-filters")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("pattern-library-card-grid")).toBeInTheDocument();
    });

    const grid = screen.getByTestId("pattern-library-card-grid");
    expect(within(grid).getAllByRole("link", { name: "Open pattern" }).length).toBeGreaterThanOrEqual(10);
    expect(screen.queryByText(/runId/i)).not.toBeInTheDocument();
  });
});
