import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunsDashboardFilters } from "@/components/operator-home/RunsDashboardFilters";

describe("RunsDashboardFilters", () => {
  it("keeps show archived checked when toggled on with no archived reviews", () => {
    const onShowArchivedChange = vi.fn();

    const { rerender } = render(
      <RunsDashboardFilters
        buyerPolishedShell={false}
        governanceWarningsOnly={false}
        showArchived={false}
        onGovernanceWarningsOnlyChange={vi.fn()}
        onShowArchivedChange={onShowArchivedChange}
      />,
    );

    fireEvent.click(screen.getByTestId("runs-dashboard-show-archived"));
    expect(onShowArchivedChange).toHaveBeenCalledWith(true);

    rerender(
      <RunsDashboardFilters
        buyerPolishedShell={false}
        governanceWarningsOnly={false}
        showArchived={true}
        onGovernanceWarningsOnlyChange={vi.fn()}
        onShowArchivedChange={onShowArchivedChange}
      />,
    );

    expect(screen.getByTestId("runs-dashboard-show-archived")).toBeChecked();
  });

  it("renders nothing in buyer-polished shell", () => {
    const { container } = render(
      <RunsDashboardFilters
        buyerPolishedShell
        governanceWarningsOnly={false}
        showArchived={false}
        onGovernanceWarningsOnlyChange={vi.fn()}
        onShowArchivedChange={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
