import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { GovernanceBypassAuditPanel } from "./GovernanceBypassAuditPanel";

const listRecentGovernanceBypassAuditEvents = vi.fn();

vi.mock("@/lib/list-recent-governance-bypass-audit-events", () => ({
  listRecentGovernanceBypassAuditEvents: (...args: unknown[]) => listRecentGovernanceBypassAuditEvents(...args),
}));

describe("GovernanceBypassAuditPanel", () => {
  beforeEach(() => {
    listRecentGovernanceBypassAuditEvents.mockReset();
  });

  it("renders recent bypass events with actor and justification", async () => {
    listRecentGovernanceBypassAuditEvents.mockResolvedValue([
      {
        eventId: "evt-1",
        occurredUtc: "2026-06-01T12:00:00.000Z",
        eventType: "GovernanceBypassInvoked",
        actorUserId: "user-1",
        actorUserName: "Alex Operator",
        tenantId: "tenant",
        workspaceId: "ws",
        projectId: "proj",
        runId: "run-abc",
        manifestId: null,
        artifactId: null,
        dataJson: JSON.stringify({
          justification: "Approved emergency release.",
          blockingFindingIds: ["finding-1", "finding-2"],
        }),
        correlationId: null,
      },
    ]);

    render(<GovernanceBypassAuditPanel />);

    await waitFor(() => {
      expect(screen.getByTestId("governance-bypass-audit-panel")).toBeInTheDocument();
    });

    expect(screen.getByText("Alex Operator")).toBeInTheDocument();
    expect(screen.getByText("Approved emergency release.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "run-abc" })).toHaveAttribute("href", "/architecture/reviews/run-abc");
    expect(screen.getByTestId("governance-bypass-row-evt-1")).toHaveTextContent("2");
  });

  it("shows empty state when no bypass events exist", async () => {
    listRecentGovernanceBypassAuditEvents.mockResolvedValue([]);

    render(<GovernanceBypassAuditPanel />);

    expect(await screen.findByText("No governance bypass events in the last 30 days.")).toBeInTheDocument();
  });
});
