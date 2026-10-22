import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GuidedModeTopBarChip } from "@/components/workspace-mode/GuidedModeTopBarChip";
import {
  WORKSPACE_MODE_GUIDED_TOP_BAR_CHIP_LABEL,
  WORKSPACE_MODE_SWITCHED_TO_WORKING_TOAST,
  WORKSPACE_MODE_SWITCH_TO_WORKING_DIALOG_TITLE,
} from "@/lib/workspace-mode/workspace-mode-copy";

const workspaceModeState = vi.hoisted(() => ({
  mode: "guided" as "guided" | "working",
  mounted: true,
  setAndPersist: vi.fn(),
}));

const showInfoMock = vi.hoisted(() => vi.fn());

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({
    mode: workspaceModeState.mode,
    mounted: workspaceModeState.mounted,
    accountSyncState: "synced",
    isWorkingMode: workspaceModeState.mode === "working",
    setAndPersist: workspaceModeState.setAndPersist,
  }),
}));

vi.mock("@/lib/toast", () => ({
  showInfo: showInfoMock,
}));

describe("GuidedModeTopBarChip", () => {
  it("renders the guided mode chip when guided mode is active", () => {
    workspaceModeState.mode = "guided";
    workspaceModeState.mounted = true;
    workspaceModeState.setAndPersist.mockClear();

    render(<GuidedModeTopBarChip />);

    expect(screen.getByTestId("guided-mode-top-bar-chip-trigger")).toHaveTextContent(
      WORKSPACE_MODE_GUIDED_TOP_BAR_CHIP_LABEL,
    );
  });

  it("hides while workspace mode is not mounted or working mode is active", () => {
    workspaceModeState.mode = "working";
    workspaceModeState.mounted = true;

    const { rerender } = render(<GuidedModeTopBarChip />);

    expect(screen.queryByTestId("guided-mode-top-bar-chip")).not.toBeInTheDocument();

    workspaceModeState.mode = "guided";
    workspaceModeState.mounted = false;
    rerender(<GuidedModeTopBarChip />);

    expect(screen.queryByTestId("guided-mode-top-bar-chip")).not.toBeInTheDocument();
  });

  it("opens a switch dialog and switches to working mode with a preferences reminder", () => {
    workspaceModeState.mode = "guided";
    workspaceModeState.mounted = true;
    workspaceModeState.setAndPersist.mockClear();
    showInfoMock.mockClear();

    render(<GuidedModeTopBarChip />);

    fireEvent.click(screen.getByTestId("guided-mode-top-bar-chip-trigger"));

    expect(screen.getByTestId("guided-mode-switch-to-working-dialog")).toBeInTheDocument();
    expect(screen.getByText(WORKSPACE_MODE_SWITCH_TO_WORKING_DIALOG_TITLE)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("guided-mode-switch-to-working-confirm"));

    expect(workspaceModeState.setAndPersist).toHaveBeenCalledWith("working");
    expect(showInfoMock).toHaveBeenCalledWith(WORKSPACE_MODE_SWITCHED_TO_WORKING_TOAST);
    expect(screen.queryByTestId("guided-mode-switch-to-working-dialog")).not.toBeInTheDocument();
  });
});
