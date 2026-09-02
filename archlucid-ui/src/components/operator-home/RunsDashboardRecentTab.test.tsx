import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunsDashboardRecentTab } from "@/components/operator-home/RunsDashboardRecentTab";
import type { RunSummary } from "@/types/authority";

const retainedRun = {
  runId: "run-retained",
  projectId: "default",
  description: "Retained review",
  hasFindingsSnapshot: true,
  hasGoldenManifest: true,
} as RunSummary;

describe("RunsDashboardRecentTab", () => {
  it("renders an outline clear affordance when governance-warnings filter is empty", () => {
    const onClear = vi.fn();

    render(
      <RunsDashboardRecentTab
        phase="ready"
        showInitialLoadingSkeleton={false}
        failure={null}
        runListError={false}
        filteredItems={[]}
        effectiveItems={[retainedRun]}
        buyerPolishedShell={true}
        showcaseDemoRun={undefined}
        showcasePrimaryCta={null}
        buyerSafeHighlight={false}
        showArchived={false}
        archivedFieldSupported={true}
        restoreBusyRequestId={null}
        governanceWarningsOnly={true}
        onClearGovernanceWarningsFilter={onClear}
        onRestoreArchivedRequest={vi.fn()}
      />,
    );

    expect(screen.getByTestId("runs-dashboard-governance-warnings-empty")).toBeInTheDocument();

    const clear = screen.getByTestId("runs-dashboard-governance-warnings-empty-clear");

    expect(clear).toHaveClass("border-neutral-300");
    fireEvent.click(clear);
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
