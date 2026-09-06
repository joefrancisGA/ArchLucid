import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunsListClient } from "./RunsListClient";

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("./use-runs-list", () => ({
  useRunsList: () => ({
    projectId: "default",
    page: 1,
    totalCount: 2,
    listContextFilter: null,
    buyerPolished: false,
    buyerPipelineLabels: false,
    buyerCollapseFilters: false,
    filterText: "",
    setFilterText: vi.fn(),
    clearFilterText: vi.fn(),
    buyerPackageScope: "all",
    sortOrder: "createdDesc",
    setSortOrder: vi.fn(),
    selectedRun: null,
    compareSelection: [],
    compareSelectionNotice: null,
    paginationAnnouncement: "",
    mobileInspectorShellRef: { current: null },
    viewportNarrow: true,
    closeInspector: vi.fn(),
    filteredSorted: [],
    workQueueSections: [],
    pages: 1,
    previousHref: "/architecture/reviews",
    nextHref: "/architecture/reviews",
    onRowActivate: vi.fn(),
    showBuyerPackageCards: false,
    showCompareSelection: false,
    toggleCompareSelection: vi.fn(),
    clearCompareSelection: vi.fn(),
    filterStatusLine: "2 reviews",
  }),
}));

describe("RunsListClient resume collapse", () => {
  it("hides continue-last when it duplicates the hub continue strip", () => {
    render(
      <RunsListClient
        runs={[
          {
            runId: "review-42",
            projectId: "default",
            createdUtc: "2026-01-15T12:00:00.000Z",
          },
        ]}
        projectId="default"
        page={1}
        pageSize={25}
        totalCount={2}
        continueStripRunId="review-42"
      />,
    );

    expect(screen.queryByTestId("runs-list-continue-last-viewed-row")).not.toBeInTheDocument();
  });
});
