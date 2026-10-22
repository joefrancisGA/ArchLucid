import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  CtoDemoTourCollapsedPill,
  CtoDemoTourNavigationFooter,
  CtoDemoTourStepIndicators,
} from "./CtoDemoTourNavigationPanel";

describe("CtoDemoTourNavigationPanel", () => {
  it("renders step indicators with current step marked", () => {
    render(
      <CtoDemoTourStepIndicators
        navigation={{
          stepIndex: 0,
          stepCount: 5,
          summaryLine: "CTO demo",
          presenterLine: "Line",
          presenterScript: "Script",
          prev: null,
          next: { href: "/next", label: "Manifest" },
        }}
        visitedSteps={new Set<number>([0])}
      />,
    );

    expect(screen.getByTestId("buyer-cto-demo-tour-step-indicators")).toBeInTheDocument();
    expect(screen.getByLabelText(/Step 1:/)).toHaveAttribute("aria-current", "step");
  });

  it("expands collapsed pill", () => {
    const onExpand = vi.fn();

    render(<CtoDemoTourCollapsedPill currentStepNumber={2} stepCount={5} onExpand={onExpand} />);

    fireEvent.click(screen.getByRole("button", { name: /Expand CTO demo tour/i }));
    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it("renders back/next navigation links", () => {
    render(
      <CtoDemoTourNavigationFooter
        navigation={{
          stepIndex: 1,
          stepCount: 5,
          summaryLine: "CTO demo",
          presenterLine: "Line",
          presenterScript: "Script",
          prev: { href: "/prev", label: "Sponsor" },
          next: { href: "/next", label: "Manifest" },
        }}
        onEndTour={vi.fn()}
      />,
    );

    expect(screen.getByTestId("buyer-cto-demo-tour-back")).toHaveAttribute("href", "/prev");
    expect(screen.getByTestId("buyer-cto-demo-tour-next")).toHaveAttribute("href", "/next");
  });
});
