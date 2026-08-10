import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpAlertsWorkspaceReadinessStrip } from "@/app/(operator)/help/_sections/HelpAlertsWorkspaceReadinessStrip";
import { ALERTS_HELP_READINESS_SECTION_TITLE } from "@/lib/alerts-help-guide-content";
import type { AlertsHelpWorkspaceReadinessSnapshot } from "@/lib/use-alerts-help-workspace-readiness";

vi.mock("@/lib/active-workspace-scope-label", () => ({
  readActiveWorkspaceScopeLabel: () => "Pilot workspace",
}));

function buildReadiness(
  overrides: Partial<AlertsHelpWorkspaceReadinessSnapshot> = {},
): AlertsHelpWorkspaceReadinessSnapshot {
  return {
    loading: false,
    loadFailed: false,
    enabledRulesCount: 1,
    enabledRulesLabel: "1 enabled rule",
    enabledRulesStatusKind: "ready",
    openAlertsLabel: "No open alerts",
    openAlertsStatusKind: "neutral",
    routingDestinationsLabel: "1 routing destination",
    routingDestinationsStatusKind: "ready",
    lastEvaluationLabel: "2 hours ago",
    lastEvaluationStatusKind: "ready",
    loadedAtUtc: "2026-07-10T12:00:00Z",
    reload: vi.fn(),
    ...overrides,
  };
}

describe("HelpAlertsWorkspaceReadinessStrip", () => {
  it("renders attributed heading, scope, and status tags", () => {
    render(<HelpAlertsWorkspaceReadinessStrip readiness={buildReadiness()} />);

    expect(
      screen.getByRole("heading", { level: 2, name: ALERTS_HELP_READINESS_SECTION_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Pilot workspace/)).toBeInTheDocument();
    expect(screen.getByText("1 enabled rule")).toBeInTheDocument();
    expect(screen.getByText("No open alerts")).toBeInTheDocument();
  });

  it("shows retry when load fails", () => {
    const reload = vi.fn();

    render(
      <HelpAlertsWorkspaceReadinessStrip
        readiness={buildReadiness({
          loadFailed: true,
          lastEvaluationLabel: "Unavailable",
          lastEvaluationStatusKind: "blocked",
          reload,
        })}
      />,
    );

    fireEvent.click(screen.getByTestId("help-alerts-workspace-readiness-retry"));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("sets aria-busy while loading", () => {
    render(
      <HelpAlertsWorkspaceReadinessStrip
        readiness={buildReadiness({ loading: true, loadedAtUtc: null })}
      />,
    );

    expect(screen.getByTestId("help-alerts-workspace-readiness")).toHaveAttribute("aria-busy", "true");
  });
});
