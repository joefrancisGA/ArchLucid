import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OperatorSegmentedModeToolbar } from "@/components/advisory/OperatorSegmentedModeToolbar";

describe("OperatorSegmentedModeToolbar", () => {
  it("moves the pressed segment with ArrowRight when arrow keyboard is enabled", () => {
    const onTabChange = vi.fn();

    render(
      <OperatorSegmentedModeToolbar
        tabs={[
          { id: "career", label: "Career", testId: "seg-career" },
          { id: "rehearsal", label: "Rehearsal", testId: "seg-rehearsal" },
        ]}
        activeTabId="career"
        onTabChange={onTabChange}
        ariaLabel="Working execution door"
        enableArrowKeyboard
      />,
    );

    fireEvent.keyDown(screen.getByTestId("seg-career"), { key: "ArrowRight" });

    expect(onTabChange).toHaveBeenCalledWith("rehearsal");
  });

  it("does not move segments with arrows when arrow keyboard is off", () => {
    const onTabChange = vi.fn();

    render(
      <OperatorSegmentedModeToolbar
        tabs={[
          { id: "career", label: "Career", testId: "seg-career" },
          { id: "rehearsal", label: "Rehearsal", testId: "seg-rehearsal" },
        ]}
        activeTabId="career"
        onTabChange={onTabChange}
        ariaLabel="Working execution door"
      />,
    );

    fireEvent.keyDown(screen.getByTestId("seg-career"), { key: "ArrowRight" });

    expect(onTabChange).not.toHaveBeenCalled();
  });
});
