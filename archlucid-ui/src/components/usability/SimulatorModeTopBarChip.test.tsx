import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SimulatorModeTopBarChip } from "@/components/usability/SimulatorModeTopBarChip";
import { SIMULATOR_MODE_TOP_BAR_CHIP_LABEL } from "@/lib/simulator-mode-chrome-copy";

const modeState = vi.hoisted(() => ({
  isSimulator: false,
  isLoading: false,
}));

vi.mock("@/hooks/use-agent-execution-mode", () => ({
  useAgentExecutionMode: () => ({
    mode: modeState.isSimulator ? "Simulator" : "Real",
    isSimulator: modeState.isSimulator,
    isLoading: modeState.isLoading,
  }),
}));

describe("SimulatorModeTopBarChip", () => {
  it("renders a loud chip when simulator mode is active", () => {
    modeState.isSimulator = true;
    modeState.isLoading = false;

    render(<SimulatorModeTopBarChip />);

    expect(screen.getByTestId("simulator-mode-top-bar-chip-label")).toHaveTextContent(
      SIMULATOR_MODE_TOP_BAR_CHIP_LABEL,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("hides while loading or in real mode", () => {
    modeState.isSimulator = false;
    modeState.isLoading = true;

    const { rerender } = render(<SimulatorModeTopBarChip />);

    expect(screen.queryByTestId("simulator-mode-top-bar-chip")).not.toBeInTheDocument();

    modeState.isLoading = false;
    rerender(<SimulatorModeTopBarChip />);

    expect(screen.queryByTestId("simulator-mode-top-bar-chip")).not.toBeInTheDocument();
  });
});
