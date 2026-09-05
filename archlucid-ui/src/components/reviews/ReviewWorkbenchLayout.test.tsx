import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  REVIEW_WORKBENCH_LAYOUT_TEST_ID,
  ReviewWorkbenchLayout,
} from "@/components/reviews/ReviewWorkbenchLayout";

describe("ReviewWorkbenchLayout", () => {
  it("renders three columns and wires focus controls", () => {
    const onFocusColumn = vi.fn();

    render(
      <ReviewWorkbenchLayout
        architecture={<div>Architecture panel</div>}
        findings={<div>Findings panel</div>}
        evidence={<div>Evidence panel</div>}
        focusColumn={null}
        onFocusColumn={onFocusColumn}
      />,
    );

    expect(screen.getByTestId(REVIEW_WORKBENCH_LAYOUT_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId("review-workbench-column-architecture")).toBeInTheDocument();
    expect(screen.getByTestId("review-workbench-column-findings")).toBeInTheDocument();
    expect(screen.getByTestId("review-workbench-column-evidence")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("review-workbench-focus-findings"));

    expect(onFocusColumn).toHaveBeenCalledWith("findings");
  });

  it("renders exit control when onExitWorkbench is provided", () => {
    const onExitWorkbench = vi.fn();

    render(
      <ReviewWorkbenchLayout
        architecture={<div>Architecture panel</div>}
        findings={<div>Findings panel</div>}
        evidence={<div>Evidence panel</div>}
        focusColumn="architecture"
        onFocusColumn={vi.fn()}
        onExitWorkbench={onExitWorkbench}
      />,
    );

    fireEvent.click(screen.getByTestId("review-workbench-exit"));

    expect(onExitWorkbench).toHaveBeenCalledTimes(1);
  });

  it("keeps the selected finding title visible in the findings column header (LS-10)", () => {
    render(
      <ReviewWorkbenchLayout
        architecture={<div>Architecture panel</div>}
        findings={<div>Findings panel</div>}
        evidence={<div>Evidence panel</div>}
        focusColumn="findings"
        onFocusColumn={vi.fn()}
        selectedFindingId="finding-claims"
        selectedFindingTitle="Claims API latency"
      />,
    );

    expect(screen.getByTestId("review-workbench-selected-finding-title")).toHaveTextContent(
      "Claims API latency",
    );
  });
});
