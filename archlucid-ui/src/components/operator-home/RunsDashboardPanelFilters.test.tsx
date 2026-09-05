import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunsDashboardPanelFilters } from "@/components/operator-home/RunsDashboardPanelFilters";
import { deriveRunsDashboardTabCounts } from "@/components/operator-home/runs-dashboard-helpers";
import { resolveRunsDashboardStatusTabIds } from "@/components/operator-home/runs-dashboard-panel-presentation";
import { Tabs } from "@/components/ui/tabs";

function renderPanelFilters(
  props: ComponentProps<typeof RunsDashboardPanelFilters>,
) {
  return render(
    <Tabs value={props.tab} variant="line" onValueChange={vi.fn()}>
      <RunsDashboardPanelFilters {...props} />
    </Tabs>,
  );
}

describe("RunsDashboardPanelFilters", () => {
  const statusTabCounts = deriveRunsDashboardTabCounts([
    {
      runId: "11111111-1111-1111-1111-111111111111",
      projectId: "default",
      description: "Active review",
      createdUtc: "2026-01-15T12:00:00.000Z",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
      isArchived: false,
    },
  ]);

  it("renders operator review views as line tabs", () => {
    renderPanelFilters({
      buyerPolishedShell: false,
      hideHeading: true,
      tab: "all",
      isRecentListTab: true,
      statusTabIds: resolveRunsDashboardStatusTabIds(false, statusTabCounts),
      statusTabCounts,
      archivedFieldSupported: true,
      archivedCount: 0,
      archivedFilterDisabled: false,
      showArchived: false,
      onSelectDashboardTab: vi.fn(),
      onShowArchivedChange: vi.fn(),
      openAllReviewsHref: "/architecture/reviews?projectId=default",
    });

    const filterGroup = screen.getByTestId("runs-dashboard-status-filters");
    expect(filterGroup).toHaveAttribute("role", "tablist");
    expect(screen.getByTestId("runs-dashboard-tab-all")).toHaveAttribute("aria-selected", "true");
  });

  it("does not render operator recent summary copy under Latest in workspace", () => {
    renderPanelFilters({
      buyerPolishedShell: false,
      hideHeading: false,
      tab: "all",
      isRecentListTab: true,
      statusTabIds: resolveRunsDashboardStatusTabIds(false, statusTabCounts),
      statusTabCounts,
      archivedFieldSupported: true,
      archivedCount: 0,
      archivedFilterDisabled: false,
      showArchived: false,
      onSelectDashboardTab: vi.fn(),
      onShowArchivedChange: vi.fn(),
      openAllReviewsHref: "/architecture/reviews?projectId=default",
    });

    expect(screen.queryByText("Showing the latest architecture reviews for this workspace.")).toBeNull();
  });

  it("shows visible helper text when a zero-count operator tab is selected", () => {
    renderPanelFilters({
      buyerPolishedShell: false,
      hideHeading: true,
      tab: "attention",
      isRecentListTab: false,
      statusTabIds: resolveRunsDashboardStatusTabIds(false, { ...statusTabCounts, attention: 0 }),
      statusTabCounts: { ...statusTabCounts, attention: 0 },
      archivedFieldSupported: true,
      archivedCount: 0,
      archivedFilterDisabled: false,
      showArchived: false,
      onSelectDashboardTab: vi.fn(),
      onShowArchivedChange: vi.fn(),
      openAllReviewsHref: "/architecture/reviews?projectId=default",
    });

    expect(screen.getByTestId("runs-dashboard-selected-tab-empty-reason")).toHaveTextContent(
      /need attention/i,
    );
  });

  it("enables archived chip with zero count and calls onShowArchivedChange(true)", () => {
    const onShowArchivedChange = vi.fn();

    renderPanelFilters({
      buyerPolishedShell: true,
      hideHeading: false,
      tab: "all",
      isRecentListTab: true,
      statusTabIds: resolveRunsDashboardStatusTabIds(true, statusTabCounts),
      statusTabCounts,
      archivedFieldSupported: true,
      archivedCount: 0,
      archivedFilterDisabled: false,
      showArchived: false,
      onSelectDashboardTab: vi.fn(),
      onShowArchivedChange,
      openAllReviewsHref: "/architecture/reviews?projectId=default",
    });

    const archivedFilter = screen.getByTestId("runs-dashboard-show-archived");
    expect(archivedFilter).not.toBeDisabled();

    fireEvent.click(archivedFilter);

    expect(onShowArchivedChange).toHaveBeenCalledWith(true);
  });
});
