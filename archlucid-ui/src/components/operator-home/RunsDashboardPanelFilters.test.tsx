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
    <Tabs value={props.tab} onValueChange={vi.fn()}>
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

  it("does not apply overflow scrolling to operator review view tabs", () => {
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

    const tabList = screen.getByTestId("runs-dashboard-status-filters");
    expect(tabList.className).not.toMatch(/overflow-x-auto/);
    expect(tabList.className).not.toMatch(/overflow-y-auto/);
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
