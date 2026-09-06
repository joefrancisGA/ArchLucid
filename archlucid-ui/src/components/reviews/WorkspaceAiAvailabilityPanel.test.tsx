import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-1",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { WorkspaceAiAvailabilityPanel } from "./WorkspaceAiAvailabilityPanel";

const fetchWorkspaceAiAvailabilityMock = vi.fn();

vi.mock("@/lib/workspace-ai-availability", async () => {
  const actual = await vi.importActual<typeof import("@/lib/workspace-ai-availability")>(
    "@/lib/workspace-ai-availability",
  );

  return {
    ...actual,
    fetchWorkspaceAiAvailability: (...args: unknown[]) => fetchWorkspaceAiAvailabilityMock(...args),
  };
});

describe("WorkspaceAiAvailabilityPanel", () => {
  beforeEach(() => {
    fetchWorkspaceAiAvailabilityMock.mockReset();
  });

  it("shows session-managed pending detail before probe results are available", () => {
    render(
      <WorkspaceAiAvailabilityPanel
        workspaceAiSignal={{
          label: "Workspace AI availability",
          detail: "Review failure pattern suggests ArchLucid-managed AI may be unavailable — use Check AI availability to confirm before re-running.",
        }}
        availabilityCheck={{
          state: { status: "idle" },
          checkAvailability: vi.fn(),
        }}
      />,
    );

    expect(fetchWorkspaceAiAvailabilityMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("review-package-workspace-ai-detail")).toHaveTextContent(
      "Starting an automatic live AI availability check",
    );
  });

  it("does not auto-check availability on mount when used standalone", () => {
    render(
      <WorkspaceAiAvailabilityPanel
        workspaceAiSignal={{
          label: "Workspace AI availability",
          detail: "Review failure pattern suggests ArchLucid-managed AI may be unavailable — use Check AI availability to confirm before re-running.",
        }}
      />,
    );

    expect(fetchWorkspaceAiAvailabilityMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("review-package-check-ai-availability-button")).toHaveTextContent(
      "Check AI availability",
    );
  });

  it("checks availability when the button is clicked and shows vendor diagnostics", async () => {
    fetchWorkspaceAiAvailabilityMock.mockResolvedValue({
      isAvailable: false,
      validated: true,
      aiSource: "managed-platform",
      summary: "ArchLucid-managed AI is unavailable — reviews cannot start until platform AI is restored.",
      asOfUtc: "2026-08-31T18:00:00.000Z",
      checks: [
        {
          name: "azure_openai_live_completion_probe",
          status: "failed",
          detail: "HTTP 401: Unauthorized — invalid API key.",
        },
      ],
      debug: {
        probeDeploymentName: "gpt-4o",
        probeModelId: "gpt-4o-2024-08-06",
      },
    });

    render(
      <WorkspaceAiAvailabilityPanel
        workspaceAiSignal={{
          label: "Workspace AI availability",
          detail: "Review failure pattern suggests ArchLucid-managed AI may be unavailable — use Check AI availability to confirm before re-running.",
        }}
      />,
    );

    fireEvent.click(screen.getByTestId("review-package-check-ai-availability-button"));

    await waitFor(() => {
      expect(screen.getByTestId("review-package-workspace-ai-debug")).toBeInTheDocument();
    });

    expect(fetchWorkspaceAiAvailabilityMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("review-package-workspace-ai-vendor-error")).toHaveTextContent("HTTP 401");
    expect(screen.getByTestId("review-package-workspace-ai-as-of")).toHaveTextContent("Validated at Aug 31, 2026, 6:00 PM UTC");
    expect(screen.getByTestId("review-package-workspace-ai-model")).toHaveTextContent("gpt-4o");
    expect(screen.getByTestId("review-package-workspace-ai-model-provenance")).toHaveTextContent(
      "managed platform",
    );
    expect(screen.queryByText("probeDeploymentName:")).not.toBeInTheDocument();
  });

  it("shows a simple OK message and collapses probe details when availability succeeds", async () => {
    fetchWorkspaceAiAvailabilityMock.mockResolvedValue({
      isAvailable: true,
      validated: true,
      aiSource: "managed-platform",
      summary: "ArchLucid-managed Azure OpenAI live probe succeeded for deployment 'gpt-4o'.",
      asOfUtc: "2026-08-31T18:00:00.000Z",
      checks: [{ name: "azure_openai_live_completion_probe", status: "ok", detail: "Live completion probe succeeded." }],
      debug: { probeDeploymentName: "gpt-4o", probeModelId: "gpt-4o-2024-08-06" },
    });

    render(
      <WorkspaceAiAvailabilityPanel
        workspaceAiSignal={{
          label: "Workspace AI availability",
          detail: "Pending validation.",
        }}
      />,
    );

    fireEvent.click(screen.getByTestId("review-package-check-ai-availability-button"));

    await waitFor(() => {
      expect(screen.getByText("AI checked — OK")).toBeInTheDocument();
    });

    expect(screen.getByTestId("review-package-workspace-ai-checked-at")).toHaveTextContent(
      "Checked Aug 31, 2026, 6:00 PM UTC",
    );
    expect(screen.queryByTestId("review-package-workspace-ai-detail")).not.toBeInTheDocument();
    expect(screen.getByTestId("review-package-recheck-ai-availability-link")).toHaveTextContent("Re-check");
    expect(screen.getByRole("button", { name: "Probe details" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Probe checks")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Probe details" }));

    await waitFor(() => {
      expect(screen.getByTestId("review-package-workspace-ai-debug")).toBeInTheDocument();
    });

    expect(screen.getByTestId("review-package-workspace-ai-model")).toHaveTextContent("gpt-4o");
    expect(screen.queryByTestId("review-package-workspace-ai-model-provenance")).not.toBeInTheDocument();
    expect(screen.getByText("Probed deployment:")).toBeInTheDocument();
  });

  it("re-checks availability from the compact header link", async () => {
    fetchWorkspaceAiAvailabilityMock.mockResolvedValue({
      isAvailable: true,
      validated: true,
      aiSource: "managed-platform",
      summary: "ArchLucid-managed Azure OpenAI live probe succeeded for deployment 'gpt-4o'.",
      asOfUtc: "2026-08-31T18:00:00.000Z",
      checks: [{ name: "azure_openai_live_completion_probe", status: "ok", detail: "Live completion probe succeeded." }],
      debug: { probeDeploymentName: "gpt-4o" },
    });

    render(
      <WorkspaceAiAvailabilityPanel
        workspaceAiSignal={{
          label: "Workspace AI availability",
          detail: "Pending validation.",
        }}
      />,
    );

    fireEvent.click(screen.getByTestId("review-package-check-ai-availability-button"));

    await waitFor(() => {
      expect(fetchWorkspaceAiAvailabilityMock).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByTestId("review-package-recheck-ai-availability-link"));

    await waitFor(() => {
      expect(fetchWorkspaceAiAvailabilityMock).toHaveBeenCalledTimes(2);
    });
  });
});
