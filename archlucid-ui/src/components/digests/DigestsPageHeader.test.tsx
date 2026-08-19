import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DIGESTS_BROWSE_PAGE_SUBTITLE } from "@/lib/digests-browse-copy";

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/digests",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
}));

import { DigestsPageHeader } from "@/components/digests/DigestsPageHeader";

describe("DigestsPageHeader", () => {
  it("renders h1, help, refresh, and last-updated metadata", () => {
    const onRefresh = vi.fn();

    render(
      <DigestsPageHeader
        subtitle={DIGESTS_BROWSE_PAGE_SUBTITLE}
        refreshing={false}
        lastUpdatedUtc="2026-07-09T12:00:00.000Z"
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Architecture digests" })).toBeInTheDocument();
    expect(screen.getByText(DIGESTS_BROWSE_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("digests-header-actions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.getByTestId("digests-last-updated")).toHaveTextContent(/Last updated:/i);

    fireEvent.click(screen.getByTestId("digests-refresh-button"));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
