import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RealModeAiReadinessShellBanner } from "@/components/usability/RealModeAiReadinessShellBanner";

const readinessState = vi.hoisted(() => ({
  isSessionReal: true,
  isLoading: false,
  isReady: false,
  detail: "AI availability check timed out after 20s.",
  hasDevOverride: false,
  hostMode: "Real" as "Simulator" | "Real" | null,
  sessionMode: "Real" as "Simulator" | "Real" | null,
  probeState: { status: "error" as const, message: "AI availability check timed out after 20s." },
  checkAvailability: vi.fn(),
  availability: null,
  blocksExecute: true,
}));

vi.mock("@/hooks/session-ai-readiness-context", () => ({
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
    readinessState.detail = "AI availability check timed out after 20s.";
    readinessState.hasDevOverride = false;
    readinessState.hostMode = "Real";
    readinessState.sessionMode = "Real";
    readinessState.probeState = {
      status: "error",
      message: "AI availability check timed out after 20s.",
    };
    readinessState.availability = null;
    readinessState.blocksExecute = true;
    readinessState.checkAvailability.mockReset();
  });

  it("renders the availability panel and recovery steps when live AI is not ready", () => {
    render(<RealModeAiReadinessShellBanner />);

    expect(screen.getByTestId("real-mode-ai-readiness-shell-banner")).toBeInTheDocument();
    expect(screen.getByTestId("review-package-workspace-ai-availability-panel")).toBeInTheDocument();
    expect(screen.getByTestId("real-mode-ai-readiness-recovery-steps")).toBeInTheDocument();
    expect(screen.getByTestId("review-package-check-ai-availability-button")).toHaveTextContent(
      "Check AI availability",
    );
  });

  it("retries the availability probe when the button is clicked", () => {
    render(<RealModeAiReadinessShellBanner />);

    fireEvent.click(screen.getByTestId("review-package-check-ai-availability-button"));

    expect(readinessState.checkAvailability).toHaveBeenCalledWith({ force: true });
  });

  it("stays visible while a retry probe is in flight", () => {
    readinessState.isLoading = true;
    readinessState.probeState = { status: "loading" };

    render(<RealModeAiReadinessShellBanner />);

    expect(screen.getByTestId("real-mode-ai-readiness-shell-banner")).toBeInTheDocument();
    expect(screen.getByTestId("real-mode-ai-readiness-shell-banner")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByTestId("review-package-check-ai-availability-button")).toHaveTextContent(
      "Checking AI availability…",
    );
  });

  it("hides when live AI is ready so only the top-bar chip reports success", () => {
    readinessState.isReady = true;
    readinessState.blocksExecute = false;
    readinessState.detail = "ArchLucid-managed Azure OpenAI live probe succeeded.";
    readinessState.probeState = {
      status: "loaded",
      result: {
        isAvailable: true,
        validated: true,
        aiSource: "managed-platform",
        summary: "ArchLucid-managed Azure OpenAI live probe succeeded.",
        asOfUtc: "2026-01-01T00:00:00Z",
        checks: [{ name: "azure_openai_configuration", status: "ok", detail: "configured" }],
        debug: {},
      },
    };

    render(<RealModeAiReadinessShellBanner />);

    expect(screen.queryByTestId("real-mode-ai-readiness-shell-banner")).not.toBeInTheDocument();
    expect(screen.queryByTestId("review-package-workspace-ai-availability-panel")).not.toBeInTheDocument();
  });

  it("hides when the session is not in Real mode", () => {
    readinessState.isSessionReal = false;

    render(<RealModeAiReadinessShellBanner />);

    expect(screen.queryByTestId("real-mode-ai-readiness-shell-banner")).not.toBeInTheDocument();
  });
});
