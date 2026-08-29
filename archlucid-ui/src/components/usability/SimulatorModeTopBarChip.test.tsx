import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SimulatorModeTopBarChip } from "@/components/usability/SimulatorModeTopBarChip";
import {
  REAL_MODE_TOP_BAR_CHIP_LABEL,
  SIMULATOR_MODE_TOP_BAR_CHIP_LABEL,
} from "@/lib/simulator-mode-chrome-copy";

const modeState = vi.hoisted(() => ({
  mode: "Real" as "Simulator" | "Real",
  isSimulator: false,
  isLoading: false,
}));

const healthState = vi.hoisted(() => ({
  agentExecutionMode: "Real" as string | undefined,
}));

const devOverrides = vi.hoisted(() => ({
  devEnabled: true,
  override: null as "Real" | "Simulator" | null,
  toggle: vi.fn(),
}));

vi.mock("@/hooks/use-agent-execution-mode", () => ({
  useAgentExecutionMode: () => ({
    mode: modeState.mode,
    isSimulator: modeState.isSimulator,
    isLoading: modeState.isLoading,
  }),
}));

vi.mock("@/hooks/use-health-ready-summary-query", () => ({
  useHealthReadySummaryQuery: () => ({
    data: healthState.agentExecutionMode
      ? { agentExecutionMode: healthState.agentExecutionMode }
      : null,
    isPending: false,
  }),
}));

vi.mock("@/lib/dev-testing-overrides", () => ({
  isDevTestingOverridesEnabled: () => devOverrides.devEnabled,
  readDevAgentExecutionModeOverrideFromDocument: () => devOverrides.override,
}));

vi.mock("@/lib/execution-mode-top-bar-chip", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/execution-mode-top-bar-chip")>();

  return {
    ...actual,
    toggleDevAgentExecutionModeFromChip: (mode: "Simulator" | "Real") => {
      devOverrides.toggle(mode);
    },
  };
});

describe("SimulatorModeTopBarChip", () => {
  it("renders a loud red chip when simulator mode is active", () => {
    modeState.mode = "Simulator";
    modeState.isSimulator = true;
    modeState.isLoading = false;
    healthState.agentExecutionMode = "Simulator";
    devOverrides.override = null;

    render(<SimulatorModeTopBarChip />);

    const toggle = screen.getByTestId("simulator-mode-top-bar-chip-toggle");

    expect(toggle).toHaveTextContent(SIMULATOR_MODE_TOP_BAR_CHIP_LABEL);
    expect(toggle.className).toContain("animate-pulse");
    expect(toggle.className).toContain("bg-red-500");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("renders a quiet ready-style chip when real mode is active after leaving simulator", () => {
    modeState.mode = "Real";
    modeState.isSimulator = false;
    modeState.isLoading = false;
    healthState.agentExecutionMode = "Simulator";
    devOverrides.override = "Real";

    render(<SimulatorModeTopBarChip />);

    const toggle = screen.getByTestId("simulator-mode-top-bar-chip-toggle");

    expect(toggle).toHaveTextContent(REAL_MODE_TOP_BAR_CHIP_LABEL);
    expect(toggle.className).toContain("var(--al-status-ready-bg)");
    expect(toggle.className).not.toContain("animate-pulse");
    expect(toggle.className).not.toContain("bg-emerald-500");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  it("toggles execution mode when clicked in development", () => {
    modeState.mode = "Simulator";
    modeState.isSimulator = true;
    modeState.isLoading = false;
    healthState.agentExecutionMode = "Simulator";
    devOverrides.override = null;
    devOverrides.toggle.mockClear();

    render(<SimulatorModeTopBarChip />);

    fireEvent.click(screen.getByTestId("simulator-mode-top-bar-chip-toggle"));

    expect(devOverrides.toggle).toHaveBeenCalledWith("Simulator");
  });

  it("hides while loading or when the host starts in real mode", () => {
    modeState.mode = "Real";
    modeState.isSimulator = false;
    modeState.isLoading = true;
    healthState.agentExecutionMode = "Real";
    devOverrides.override = null;

    const { rerender } = render(<SimulatorModeTopBarChip />);

    expect(screen.queryByTestId("simulator-mode-top-bar-chip")).not.toBeInTheDocument();

    modeState.isLoading = false;
    rerender(<SimulatorModeTopBarChip />);

    expect(screen.queryByTestId("simulator-mode-top-bar-chip")).not.toBeInTheDocument();
  });

  it("renders a non-interactive status chip outside development", () => {
    modeState.mode = "Simulator";
    modeState.isSimulator = true;
    modeState.isLoading = false;
    healthState.agentExecutionMode = "Simulator";
    devOverrides.override = null;
    devOverrides.devEnabled = false;

    render(<SimulatorModeTopBarChip />);

    expect(screen.queryByTestId("simulator-mode-top-bar-chip-toggle")).not.toBeInTheDocument();
    expect(screen.getByTestId("simulator-mode-top-bar-chip-label")).toHaveTextContent(
      SIMULATOR_MODE_TOP_BAR_CHIP_LABEL,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();

    devOverrides.devEnabled = true;
  });
});
