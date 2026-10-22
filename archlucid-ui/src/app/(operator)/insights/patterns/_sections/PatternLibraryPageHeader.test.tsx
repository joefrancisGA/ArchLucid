import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PATTERN_LIBRARY_PAGE_SUBTITLE_BUYER } from "@/lib/pattern-library-copy";

vi.mock("next/navigation", () => ({
  usePathname: () => "/insights/patterns",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { PatternLibraryPageHeader } from "@/app/(operator)/insights/patterns/_sections/PatternLibraryPageHeader";

describe("PatternLibraryPageHeader", () => {
  it("renders h2, breadcrumb, help, refresh, badge, and last-updated metadata", () => {
    const onRefresh = vi.fn();

    render(
      <PatternLibraryPageHeader
        subtitle={PATTERN_LIBRARY_PAGE_SUBTITLE_BUYER}
        provenance={{
          badgeLabel: "Sample data",
          notice: "Sample pattern data is shown in this workspace.",
          privacyNote: "Pattern statistics are anonymized and thresholded.",
        }}
        showProvenanceDetails={false}
        refreshing={false}
        lastUpdatedUtc="2026-01-01T00:00:00.000Z"
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Pattern library" })).toBeInTheDocument();
    expect(screen.getByText(PATTERN_LIBRARY_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("pattern-library-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("pattern-library-provenance-badge")).toHaveTextContent("Sample data");
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
