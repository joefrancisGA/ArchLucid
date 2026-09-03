import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GuidedModeSwitchToWorkingDialog } from "@/components/workspace-mode/GuidedModeSwitchToWorkingDialog";
import {
  WORKSPACE_MODE_SWITCH_TO_WORKING_DIALOG_STAY_CTA,
  WORKSPACE_MODE_SWITCH_TO_WORKING_DIALOG_SWITCH_CTA,
  WORKSPACE_MODE_SWITCH_TO_WORKING_DIALOG_TITLE,
} from "@/lib/workspace-mode/workspace-mode-copy";

describe("GuidedModeSwitchToWorkingDialog", () => {
  it("renders the switch-to-working confirmation dialog", () => {
    const onSwitchToWorking = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <GuidedModeSwitchToWorkingDialog open onOpenChange={onOpenChange} onSwitchToWorking={onSwitchToWorking} />,
    );

    expect(screen.getByText(WORKSPACE_MODE_SWITCH_TO_WORKING_DIALOG_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("guided-mode-switch-to-working-stay")).toHaveTextContent(
      WORKSPACE_MODE_SWITCH_TO_WORKING_DIALOG_STAY_CTA,
    );
    expect(screen.getByTestId("guided-mode-switch-to-working-confirm")).toHaveTextContent(
      WORKSPACE_MODE_SWITCH_TO_WORKING_DIALOG_SWITCH_CTA,
    );
  });

  it("calls onSwitchToWorking when confirmed", () => {
    const onSwitchToWorking = vi.fn();

    render(
      <GuidedModeSwitchToWorkingDialog open onOpenChange={vi.fn()} onSwitchToWorking={onSwitchToWorking} />,
    );

    fireEvent.click(screen.getByTestId("guided-mode-switch-to-working-confirm"));

    expect(onSwitchToWorking).toHaveBeenCalledTimes(1);
  });
});
