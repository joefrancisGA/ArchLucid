import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WorkingCareerDoorBlockedDialog } from "@/components/workspace-mode/WorkingCareerDoorBlockedDialog";
import { WORKING_CAREER_DOOR_HOST_SIMULATOR_BLOCKED_DETAIL } from "@/lib/governance/working-career-door-gate-copy";
import { WORKING_CAREER_DOOR_PLATFORM_SETTINGS_HREF } from "@/lib/governance/working-career-door-gate";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

const blockedGate = {
  isCareerExecuteBlocked: true,
  blockReason: "host-simulator-pinned" as const,
  blockedDetail: WORKING_CAREER_DOOR_HOST_SIMULATOR_BLOCKED_DETAIL,
  platformSettingsHref: WORKING_CAREER_DOOR_PLATFORM_SETTINGS_HREF,
};

describe("WorkingCareerDoorBlockedDialog", () => {
  it("offers Rehearsal and platform settings actions", () => {
    const onSwitchToRehearsal = vi.fn();
    const onOpenChange = vi.fn();

    renderWithOperatorQuery(
      <WorkingCareerDoorBlockedDialog
        open
        onOpenChange={onOpenChange}
        gate={blockedGate}
        onSwitchToRehearsal={onSwitchToRehearsal}
      />,
    );

    expect(screen.getByText(WORKING_CAREER_DOOR_HOST_SIMULATOR_BLOCKED_DETAIL)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("working-career-door-switch-to-rehearsal"));
    expect(onSwitchToRehearsal).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);

    expect(screen.getByTestId("working-career-door-platform-settings")).toHaveAttribute(
      "href",
      WORKING_CAREER_DOOR_PLATFORM_SETTINGS_HREF,
    );

    fireEvent.click(screen.getByTestId("working-career-door-platform-settings"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("places Close as the rightmost footer action", () => {
    renderWithOperatorQuery(
      <WorkingCareerDoorBlockedDialog
        open
        onOpenChange={vi.fn()}
        gate={blockedGate}
        onSwitchToRehearsal={vi.fn()}
      />,
    );

    const switchToPractice = screen.getByTestId("working-career-door-switch-to-rehearsal");
    const platformSettings = screen.getByTestId("working-career-door-platform-settings");
    const close = screen.getByRole("button", { name: "Close" });

    expect(switchToPractice.compareDocumentPosition(close) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(platformSettings.compareDocumentPosition(close) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
