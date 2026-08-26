import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SimulatorModeAiOperationNotice } from "@/components/usability/SimulatorModeAiOperationNotice";
import { SIMULATOR_MODE_AI_OPERATION_NOTICE_TITLE } from "@/lib/simulator-mode-chrome-copy";

const modeState = vi.hoisted(() => ({
  isSimulator: false,
}));

vi.mock("@/hooks/use-agent-execution-mode", () => ({
  useAgentExecutionMode: () => ({
    mode: modeState.isSimulator ? "Simulator" : "Real",
    isSimulator: modeState.isSimulator,
    isLoading: false,
  }),
}));

describe("SimulatorModeAiOperationNotice", () => {
  it("warns after AI operations when simulator mode is active", () => {
    modeState.isSimulator = true;

    render(<SimulatorModeAiOperationNotice />);

    expect(screen.getByTestId("simulator-mode-ai-operation-notice")).toBeInTheDocument();
    expect(screen.getByText(SIMULATOR_MODE_AI_OPERATION_NOTICE_TITLE)).toBeInTheDocument();
  });

  it("renders nothing in real mode", () => {
    modeState.isSimulator = false;

    render(<SimulatorModeAiOperationNotice />);

    expect(screen.queryByTestId("simulator-mode-ai-operation-notice")).not.toBeInTheDocument();
  });
});
