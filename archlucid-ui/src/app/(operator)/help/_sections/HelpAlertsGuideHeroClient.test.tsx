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
    loadForbidden: false,
    enabledRulesCount: 0,
    enabledRulesLabel: "0 enabled rules",
    enabledRulesStatusKind: "needs-attention",
    openAlertsLabel: "No open alerts",
    openAlertsStatusKind: "neutral",
    routingDestinationsLabel: "No routing configured",
    routingDestinationsStatusKind: "needs-attention",
    lastEvaluationLabel: "Rules not configured",
    lastEvaluationStatusKind: "needs-attention",
    workspaceScopeLabel: "This workspace",
    loadedAtUtc: "2026-07-10T12:00:00Z",
    reload: vi.fn(),
  } satisfies AlertsHelpWorkspaceReadinessSnapshot,
}));

vi.mock("@/lib/use-alerts-help-workspace-readiness", () => ({
  useAlertsHelpWorkspaceReadiness: () => readinessState.current,
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
    expect(within(actionPanel).getAllByRole("link", { name: ALERTS_HELP_PRIMARY_ACTIONS.openInbox.label })).toHaveLength(1);
    expect(within(actionPanel).getAllByRole("link", { name: ALERTS_HELP_PRIMARY_ACTIONS.configureRules.label })).toHaveLength(1);
  });

  it("promotes open inbox when enabled rules exist", () => {
    readinessState.current = {
      ...readinessState.current,
      loading: false,
      loadFailed: false,
      loadForbidden: false,
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
    expect(within(actionPanel).getAllByRole("link", { name: ALERTS_HELP_PRIMARY_ACTIONS.openInbox.label })).toHaveLength(1);
    expect(within(actionPanel).getAllByRole("link", { name: ALERTS_HELP_PRIMARY_ACTIONS.configureRules.label })).toHaveLength(1);
  });

  it("shows a single disabled primary action while loading", () => {
    readinessState.current = {
      ...readinessState.current,
      loading: true,
      loadFailed: false,
      loadForbidden: false,
      enabledRulesCount: 0,
      workspaceScopeLabel: null,
    };

    render(<HelpAlertsGuideHeroClient />);

    const actionPanel = screen.getByTestId("help-alerts-action-panel");
    expect(within(actionPanel).getByText(ALERTS_HELP_ACTION_PANEL_TITLES.loading)).toBeInTheDocument();
    expect(within(actionPanel).getAllByTestId("help-alerts-primary-cta")).toHaveLength(1);
    expect(within(actionPanel).getByTestId("help-alerts-primary-cta")).toBeDisabled();
    expect(within(actionPanel).queryByRole("link", { name: ALERTS_HELP_PRIMARY_ACTIONS.configureRules.label })).not.toBeInTheDocument();
  });

  it("shows a single primary inbox action when load fails", () => {
    readinessState.current = {
      ...readinessState.current,
      loading: false,
      loadFailed: true,
      loadForbidden: false,
      enabledRulesCount: 0,
      workspaceScopeLabel: null,
    };

    render(<HelpAlertsGuideHeroClient />);

    const actionPanel = screen.getByTestId("help-alerts-action-panel");
    expect(within(actionPanel).getByText(ALERTS_HELP_ACTION_PANEL_TITLES.unavailable)).toBeInTheDocument();
    expect(within(actionPanel).getAllByTestId("help-alerts-primary-cta")).toHaveLength(1);
    expect(
      within(actionPanel).getByTestId("help-alerts-primary-cta"),
    ).toHaveTextContent(ALERTS_HELP_PRIMARY_ACTIONS.openInbox.label);
    expect(within(actionPanel).queryByRole("link", { name: ALERTS_HELP_PRIMARY_ACTIONS.configureRules.label })).not.toBeInTheDocument();
  });

  it("shows a single primary inbox action when access is forbidden", () => {
    readinessState.current = {
      ...readinessState.current,
      loading: false,
      loadFailed: false,
      loadForbidden: true,
      enabledRulesCount: 0,
      workspaceScopeLabel: null,
    };

    render(<HelpAlertsGuideHeroClient />);

    const actionPanel = screen.getByTestId("help-alerts-action-panel");
    expect(within(actionPanel).getAllByTestId("help-alerts-primary-cta")).toHaveLength(1);
    expect(within(actionPanel).queryByRole("link", { name: ALERTS_HELP_PRIMARY_ACTIONS.configureRules.label })).not.toBeInTheDocument();
  });
});
