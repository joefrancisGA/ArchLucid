import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpAlertsGuideHeroClient } from "@/app/(operator)/help/_sections/HelpAlertsGuideHeroClient";
import {
  ALERTS_HELP_ACTION_PANEL_TITLES,
  ALERTS_HELP_PRIMARY_ACTIONS,
} from "@/lib/alerts-help-guide-content";
import type { AlertsHelpWorkspaceReadinessSnapshot } from "@/lib/use-alerts-help-workspace-readiness";

const readinessState = vi.hoisted(() => ({
  current: {
    loading: false,
    loadFailed: false,
    enabledRulesCount: 0,
    enabledRulesLabel: "0 enabled rules",
    enabledRulesStatusKind: "needs-attention",
    openAlertsLabel: "No open alerts",
    openAlertsStatusKind: "neutral",
    routingDestinationsLabel: "No routing configured",
    routingDestinationsStatusKind: "needs-attention",
    lastEvaluationLabel: "Rules not configured",
    lastEvaluationStatusKind: "needs-attention",
    loadedAtUtc: "2026-07-10T12:00:00Z",
    reload: vi.fn(),
  } satisfies AlertsHelpWorkspaceReadinessSnapshot,
}));

vi.mock("@/lib/use-alerts-help-workspace-readiness", () => ({
  useAlertsHelpWorkspaceReadiness: () => readinessState.current,
}));

vi.mock("@/lib/active-workspace-scope-label", () => ({
  readActiveWorkspaceScopeLabel: () => "Pilot workspace",
}));

describe("HelpAlertsGuideHeroClient", () => {
  it("promotes configure rules when no enabled rules exist", () => {
    readinessState.current = {
      ...readinessState.current,
      enabledRulesCount: 0,
    };

    render(<HelpAlertsGuideHeroClient />);

    const actionPanel = screen.getByTestId("help-alerts-action-panel");
    expect(within(actionPanel).getByText(ALERTS_HELP_ACTION_PANEL_TITLES["rules-not-configured"])).toBeInTheDocument();
    expect(
      within(actionPanel).getByTestId("help-alerts-primary-cta"),
    ).toHaveTextContent(ALERTS_HELP_PRIMARY_ACTIONS.configureRules.label);
  });

  it("promotes open inbox when enabled rules exist", () => {
    readinessState.current = {
      ...readinessState.current,
      loading: false,
      loadFailed: false,
      enabledRulesCount: 2,
      enabledRulesLabel: "2 enabled rules",
      enabledRulesStatusKind: "ready",
    };

    render(<HelpAlertsGuideHeroClient />);

    const actionPanel = screen.getByTestId("help-alerts-action-panel");
    expect(within(actionPanel).getByText(ALERTS_HELP_ACTION_PANEL_TITLES["ready-for-inbox"])).toBeInTheDocument();
    expect(
      within(actionPanel).getByTestId("help-alerts-primary-cta"),
    ).toHaveTextContent(ALERTS_HELP_PRIMARY_ACTIONS.openInbox.label);
  });

  it("does not claim rules are unconfigured while loading", () => {
    readinessState.current = {
      ...readinessState.current,
      loading: true,
      loadFailed: false,
      enabledRulesCount: 0,
    };

    render(<HelpAlertsGuideHeroClient />);

    const actionPanel = screen.getByTestId("help-alerts-action-panel");
    expect(within(actionPanel).getByText(ALERTS_HELP_ACTION_PANEL_TITLES.loading)).toBeInTheDocument();
    expect(within(actionPanel).queryByTestId("help-alerts-primary-cta")).not.toBeInTheDocument();
  });

  it("does not claim rules are unconfigured when load fails", () => {
    readinessState.current = {
      ...readinessState.current,
      loading: false,
      loadFailed: true,
      enabledRulesCount: 0,
    };

    render(<HelpAlertsGuideHeroClient />);

    const actionPanel = screen.getByTestId("help-alerts-action-panel");
    expect(within(actionPanel).getByText(ALERTS_HELP_ACTION_PANEL_TITLES.unavailable)).toBeInTheDocument();
    expect(within(actionPanel).queryByTestId("help-alerts-primary-cta")).not.toBeInTheDocument();
  });
});
