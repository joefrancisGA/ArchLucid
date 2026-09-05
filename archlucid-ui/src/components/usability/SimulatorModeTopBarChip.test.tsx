import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SimulatorModeTopBarChip } from "@/components/usability/SimulatorModeTopBarChip";
import {
  ANALYSIS_MODE_RULE_BASED_LABEL,
  ANALYSIS_MODE_WORKSPACE_LABEL,
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

vi.mock("@/hooks/session-ai-readiness-context", () => ({
  useSessionAiReadiness: () => ({
    isSessionReal: true,
    isLoading: false,
    isReady: true,
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

const navigationMock = vi.hoisted(() => ({
  pathname: "/",
  replace: vi.fn(),
  search: "",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMock.pathname,
  useRouter: () => ({ replace: navigationMock.replace }),
  useSearchParams: () => new URLSearchParams(navigationMock.search),
}));

describe("SimulatorModeTopBarChip", () => {
  it("renders an explicit analysis-mode button in development", () => {
    modeState.mode = "Simulator";
    modeState.isSimulator = true;
    modeState.isLoading = false;
    healthState.agentExecutionMode = "Simulator";
    devOverrides.override = null;
    devOverrides.devEnabled = true;

    render(<SimulatorModeTopBarChip />);

    expect(screen.getByTestId("simulator-mode-top-bar-chip-toggle")).toHaveTextContent(
      `Analysis: ${ANALYSIS_MODE_RULE_BASED_LABEL}`,
    );
    expect(screen.getByTestId("simulator-mode-top-bar-chip-toggle")).not.toHaveAttribute("aria-pressed");
  });

  it("requires confirmation before switching analysis mode", () => {
    modeState.mode = "Simulator";
    modeState.isSimulator = true;
    modeState.isLoading = false;
    healthState.agentExecutionMode = "Simulator";
    devOverrides.override = null;
    devOverrides.toggle.mockClear();

    render(<SimulatorModeTopBarChip />);

    fireEvent.click(screen.getByTestId("simulator-mode-top-bar-chip-toggle"));
    expect(screen.getByTestId("analysis-mode-switch-dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: `Switch to ${ANALYSIS_MODE_WORKSPACE_LABEL}` }));
    expect(devOverrides.toggle).toHaveBeenCalledWith("Simulator");
  });

  it("hides while loading or when dev overrides are disabled", () => {
    modeState.mode = "Real";
    modeState.isSimulator = false;
    modeState.isLoading = true;
    healthState.agentExecutionMode = "Real";
    devOverrides.override = null;
    devOverrides.devEnabled = true;

    const { rerender } = render(<SimulatorModeTopBarChip />);

    expect(screen.queryByTestId("simulator-mode-top-bar-chip-toggle")).not.toBeInTheDocument();

    modeState.isLoading = false;
    devOverrides.devEnabled = false;
    rerender(<SimulatorModeTopBarChip />);

    expect(screen.queryByTestId("simulator-mode-top-bar-chip-toggle")).not.toBeInTheDocument();

    devOverrides.devEnabled = true;
  });
});
