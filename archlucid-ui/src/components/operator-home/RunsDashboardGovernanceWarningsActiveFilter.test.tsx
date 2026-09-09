import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunsDashboardGovernanceWarningsActiveFilter } from "@/components/operator-home/RunsDashboardGovernanceWarningsActiveFilter";

describe("RunsDashboardGovernanceWarningsActiveFilter", () => {
  it("renders a clear affordance when approval warnings filter is active", () => {
    const onClear = vi.fn();

    render(<RunsDashboardGovernanceWarningsActiveFilter visible={true} onClear={onClear} />);

    expect(screen.getByTestId("runs-dashboard-governance-warnings-active-filter")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("runs-dashboard-governance-warnings-clear"));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when the filter is inactive", () => {
    render(<RunsDashboardGovernanceWarningsActiveFilter visible={false} onClear={vi.fn()} />);

    expect(screen.queryByTestId("runs-dashboard-governance-warnings-active-filter")).toBeNull();
  });
});
