import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RealModeAiReadinessShellBanner } from "@/components/usability/RealModeAiReadinessShellBanner";
import {
  REAL_MODE_AI_READINESS_BLOCKED_DETAIL,
  REAL_MODE_AI_READINESS_BLOCKED_TITLE,
} from "@/lib/simulator-mode-chrome-copy";

const readinessState = vi.hoisted(() => ({
  isSessionReal: true,
  isLoading: false,
  isReady: false,
  detail: "AI availability check timed out after 12s.",
  hasDevOverride: false,
  hostMode: "Real" as "Simulator" | "Real" | null,
  sessionMode: "Real" as "Simulator" | "Real" | null,
  probeState: { status: "error" as const, message: "AI availability check timed out after 12s." },
  checkAvailability: vi.fn(),
}));

vi.mock("@/hooks/use-session-ai-readiness", () => ({
  useSessionAiReadiness: () => readinessState,
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => false,
  isNextPublicDemoMode: () => false,
}));

vi.mock("@/lib/operator/operator-static-demo", () => ({
  isStaticDemoPayloadFallbackEnabled: () => false,
}));

describe("RealModeAiReadinessShellBanner", () => {
  beforeEach(() => {
    readinessState.isSessionReal = true;
    readinessState.isLoading = false;
    readinessState.isReady = false;
    readinessState.detail = "AI availability check timed out after 12s.";
    readinessState.hasDevOverride = false;
    readinessState.hostMode = "Real";
    readinessState.sessionMode = "Real";
    readinessState.probeState = {
      status: "error",
      message: "AI availability check timed out after 12s.",
    };
    readinessState.checkAvailability.mockReset();
  });

  it("renders the blocked title, detail, and a retry button when live AI is not ready", () => {
    render(<RealModeAiReadinessShellBanner />);

    expect(screen.getByTestId("real-mode-ai-readiness-shell-banner")).toBeInTheDocument();
    expect(screen.getByText(REAL_MODE_AI_READINESS_BLOCKED_TITLE)).toBeInTheDocument();
    expect(screen.getByText("AI availability check timed out after 12s.")).toBeInTheDocument();
    expect(screen.getByTestId("real-mode-ai-readiness-check-button")).toHaveTextContent(
      "Check AI availability",
    );
  });

  it("retries the availability probe when the button is clicked", () => {
    render(<RealModeAiReadinessShellBanner />);

    fireEvent.click(screen.getByTestId("real-mode-ai-readiness-check-button"));

    expect(readinessState.checkAvailability).toHaveBeenCalledWith({ force: true });
  });

  it("shows a loading label and disables the button while the probe is running", () => {
    readinessState.isLoading = true;
    readinessState.probeState = { status: "loading" };
    readinessState.detail = "Validating live AI readiness for this session…";

    render(<RealModeAiReadinessShellBanner />);

    expect(screen.getByTestId("real-mode-ai-readiness-shell-banner")).toBeInTheDocument();
    expect(screen.getByTestId("real-mode-ai-readiness-shell-banner")).toHaveAttribute("aria-busy", "true");

    const button = screen.getByTestId("real-mode-ai-readiness-check-button");

    expect(button).toHaveTextContent("Checking AI availability…");
    expect(button).toBeDisabled();
  });

  it("stays visible while a retry probe is in flight after a prior failure", () => {
    readinessState.isLoading = true;
    readinessState.probeState = { status: "loading" };
    readinessState.detail = "Validating live AI readiness for this session…";

    render(<RealModeAiReadinessShellBanner />);

    expect(screen.getByTestId("real-mode-ai-readiness-shell-banner")).toBeInTheDocument();
    expect(screen.getByText("Validating live AI readiness for this session…")).toBeInTheDocument();
  });

  it("hides when live AI is already ready", () => {
    readinessState.isReady = true;

    render(<RealModeAiReadinessShellBanner />);

    expect(screen.queryByTestId("real-mode-ai-readiness-shell-banner")).not.toBeInTheDocument();
  });

  it("falls back to the default blocked detail when no probe detail is available", () => {
    readinessState.detail = null;

    render(<RealModeAiReadinessShellBanner />);

    expect(screen.getByText(REAL_MODE_AI_READINESS_BLOCKED_DETAIL)).toBeInTheDocument();
  });
});
