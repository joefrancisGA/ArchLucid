import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

  it("auto-checks availability and shows validated unavailable diagnostics", async () => {
    fetchWorkspaceAiAvailabilityMock.mockResolvedValue({
      isAvailable: false,
      validated: true,
      aiSource: "managed-platform",
      summary: "ArchLucid-managed AI is unavailable — reviews cannot start until platform AI is restored.",
      asOfUtc: "2026-08-31T18:00:00.000Z",
      checks: [
        {
          name: "azure_openai_tcp_probe",
          status: "failed",
          detail: "TCP connect to 'example.openai.azure.com' timed out after 2.0s.",
        },
      ],
      debug: {
        agentExecutionMode: "Real",
        azureOpenAiEndpointHost: "example.openai.azure.com",
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

    await waitFor(() => {
      expect(screen.getByTestId("review-package-workspace-ai-debug")).toBeInTheDocument();
    });

    expect(fetchWorkspaceAiAvailabilityMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("review-package-workspace-ai-detail")).toHaveTextContent(
      "ArchLucid-managed AI is unavailable",
    );
    expect(screen.getByText(/azure_openai_tcp_probe/)).toBeInTheDocument();
    expect(screen.getByTestId("review-package-workspace-ai-debug")).toHaveTextContent("example.openai.azure.com");
  });

  it("re-checks availability when the button is clicked", async () => {
    fetchWorkspaceAiAvailabilityMock.mockResolvedValue({
      isAvailable: true,
      validated: true,
      aiSource: "managed-platform",
      summary: "ArchLucid-managed Azure OpenAI probes succeeded for this host.",
      asOfUtc: "2026-08-31T18:00:00.000Z",
      checks: [{ name: "azure_openai_tcp_probe", status: "ok", detail: "TCP connect succeeded." }],
      debug: {},
    });

    render(
      <WorkspaceAiAvailabilityPanel
        workspaceAiSignal={{
          label: "Workspace AI availability",
          detail: "Pending validation.",
        }}
      />,
    );

    await waitFor(() => {
      expect(fetchWorkspaceAiAvailabilityMock).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByTestId("review-package-check-ai-availability-button"));

    await waitFor(() => {
      expect(fetchWorkspaceAiAvailabilityMock).toHaveBeenCalledTimes(2);
    });
  });
});
