import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpAlertsWorkspaceReadinessStrip } from "@/app/(operator)/help/_sections/HelpAlertsWorkspaceReadinessStrip";
import {
  ALERTS_HELP_MOST_RECENT_ALERT_ACTIVITY_HELPER,
  ALERTS_HELP_READINESS_FORBIDDEN_MESSAGE,
  ALERTS_HELP_READINESS_LABELS,
  ALERTS_HELP_READINESS_SECTION_TITLE,
} from "@/lib/alerts-help-guide-content";
import { ALERTS_HELP_WORKSPACE_SCOPE_FALLBACK_LABEL } from "@/lib/use-alerts-help-workspace-readiness";
import type { AlertsHelpWorkspaceReadinessSnapshot } from "@/lib/use-alerts-help-workspace-readiness";

function buildReadiness(
  overrides: Partial<AlertsHelpWorkspaceReadinessSnapshot> = {},
): AlertsHelpWorkspaceReadinessSnapshot {
  return {
    loading: false,
    loadFailed: false,
    loadForbidden: false,
    enabledRulesCount: 1,
    enabledRulesLabel: "1 enabled rule",
    enabledRulesStatusKind: "ready",
    openAlertsLabel: "No open alerts",
    openAlertsStatusKind: "neutral",
    routingDestinationsLabel: "1 routing destination",
    routingDestinationsStatusKind: "ready",
    lastEvaluationLabel: "2 hours ago",
    lastEvaluationStatusKind: "ready",
    workspaceScopeLabel: ALERTS_HELP_WORKSPACE_SCOPE_FALLBACK_LABEL,
    loadedAtUtc: "2026-07-10T12:00:00Z",
    reload: vi.fn(),
    ...overrides,
  };
}

describe("HelpAlertsWorkspaceReadinessStrip", () => {
  it("renders attributed heading, API scope, activity helper, and status tags", () => {
    render(<HelpAlertsWorkspaceReadinessStrip readiness={buildReadiness()} />);

    expect(
      screen.getByRole("heading", { level: 2, name: ALERTS_HELP_READINESS_SECTION_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByText(/This workspace · As of/)).toBeInTheDocument();
    expect(screen.getByText(ALERTS_HELP_READINESS_LABELS.mostRecentAlertActivity)).toBeInTheDocument();
    expect(screen.getByText(ALERTS_HELP_MOST_RECENT_ALERT_ACTIVITY_HELPER)).toBeInTheDocument();
    expect(screen.getByText("1 enabled rule")).toBeInTheDocument();
    expect(screen.getByText("No open alerts")).toBeInTheDocument();
  });

  it("suppresses scope until readiness resolves", () => {
    render(
      <HelpAlertsWorkspaceReadinessStrip
        readiness={buildReadiness({ loading: true, workspaceScopeLabel: null, loadedAtUtc: null })}
      />,
    );

    expect(screen.queryByText(ALERTS_HELP_WORKSPACE_SCOPE_FALLBACK_LABEL)).not.toBeInTheDocument();
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("shows retry when load fails", () => {
    const reload = vi.fn();

    render(
      <HelpAlertsWorkspaceReadinessStrip
        readiness={buildReadiness({
          loadFailed: true,
          lastEvaluationLabel: "Unavailable",
          lastEvaluationStatusKind: "blocked",
          workspaceScopeLabel: null,
          reload,
        })}
      />,
    );

    fireEvent.click(screen.getByTestId("help-alerts-workspace-readiness-retry"));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("shows forbidden guidance without blocked tags or retry", () => {
    render(
      <HelpAlertsWorkspaceReadinessStrip
        readiness={buildReadiness({
          loadForbidden: true,
          enabledRulesLabel: "",
          openAlertsLabel: "",
          routingDestinationsLabel: "",
          lastEvaluationLabel: "",
          workspaceScopeLabel: null,
        })}
      />,
    );

    expect(screen.getByTestId("help-alerts-workspace-readiness-forbidden")).toHaveTextContent(
      ALERTS_HELP_READINESS_FORBIDDEN_MESSAGE,
    );
    expect(screen.queryByText("Unavailable")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-alerts-workspace-readiness-retry")).not.toBeInTheDocument();
  });

  it("sets aria-busy while loading", () => {
    render(
      <HelpAlertsWorkspaceReadinessStrip
        readiness={buildReadiness({ loading: true, loadedAtUtc: null, workspaceScopeLabel: null })}
      />,
    );

    expect(screen.getByTestId("help-alerts-workspace-readiness")).toHaveAttribute("aria-busy", "true");
  });
});
