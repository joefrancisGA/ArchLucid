import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { alertsConfigurationPageSubtitle } from "@/lib/alerts-page-copy";
import {
  ALERT_RULES_CONFIG_NEVER_CONFIGURED_LABEL,
} from "@/lib/alert-rule-conditions-copy";

vi.mock("next/navigation", () => ({
  usePathname: () => "/governance/alert-rules",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: ({ triggerText }: { triggerText?: string }) => (
    <div data-testid="page-contextual-help-button">{triggerText ?? "Help"}</div>
  ),
}));

import { AlertRulesPageHeader } from "@/app/(operator)/governance/alert-rules/AlertRulesPageHeader";

describe("AlertRulesPageHeader", () => {
  it("renders h1, short help, and icon refresh without provenance before rules load", () => {
    const onRefresh = vi.fn();

    render(
      <AlertRulesPageHeader
        subtitle={alertsConfigurationPageSubtitle(false)}
        activeTab="rules"
        rulesTabCount={undefined}
        rulesConfigChange={null}
        refreshing={false}
        lastRefreshedAt={null}
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Alert rules" })).toBeInTheDocument();
    expect(screen.getByTestId("page-heading-icon")).toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-page-breadcrumb")).toHaveTextContent("Governance");
    expect(screen.getByTestId("alert-rules-page-breadcrumb")).toHaveTextContent("Alert rules");
    expect(screen.getByRole("link", { name: "Governance" })).toHaveAttribute("href", "/governance/approval-queue");
    expect(screen.getByText(alertsConfigurationPageSubtitle(false))).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toHaveTextContent("Help");
    expect(screen.getByTestId("alert-rules-header-actions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.queryByTestId("alert-rules-open-inbox-link")).toBeNull();
    expect(screen.queryByTestId("alert-rules-config-provenance")).toBeNull();
    expect(screen.queryByTestId("alert-rules-last-refreshed")).toBeNull();

    fireEvent.click(screen.getByTestId("alert-rules-refresh-button"));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("shows never-configured provenance and audit trail when rules tab reports zero rules", () => {
    render(
      <AlertRulesPageHeader
        subtitle={alertsConfigurationPageSubtitle(false)}
        activeTab="rules"
        rulesTabCount={0}
        rulesConfigChange={null}
        refreshing={false}
        lastRefreshedAt={new Date("2026-07-09T12:00:00.000Z")}
        onRefresh={vi.fn()}
      />,
    );

    expect(screen.getByTestId("alert-rules-config-provenance")).toHaveTextContent(
      ALERT_RULES_CONFIG_NEVER_CONFIGURED_LABEL,
    );
    expect(screen.getByRole("link", { name: "View audit trail" })).toHaveAttribute("href", "/governance/audit");
  });

  it("shows last-configured provenance after rules exist", () => {
    render(
      <AlertRulesPageHeader
        subtitle={alertsConfigurationPageSubtitle(false)}
        activeTab="rules"
        rulesTabCount={2}
        rulesConfigChange={{ recordedUtc: "2026-07-09T12:00:00.000Z", actor: null }}
        refreshing={false}
        lastRefreshedAt={new Date("2026-07-09T12:00:00.000Z")}
        onRefresh={vi.fn()}
      />,
    );

    expect(screen.getByTestId("alert-rules-config-provenance")).toHaveTextContent(/Configuration last recorded/i);
    expect(screen.getByRole("link", { name: "View audit trail" })).toHaveAttribute("href", "/governance/audit");
  });

  it("shows last-refreshed metadata on non-rules tabs after load", () => {
    render(
      <AlertRulesPageHeader
        subtitle={alertsConfigurationPageSubtitle(false)}
        activeTab="notifications"
        rulesTabCount={2}
        rulesConfigChange={{ recordedUtc: "2026-07-09T12:00:00.000Z", actor: null }}
        refreshing={false}
        lastRefreshedAt={new Date("2026-07-09T12:00:00.000Z")}
        onRefresh={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("alert-rules-config-provenance")).toBeNull();
    expect(screen.getByTestId("alert-rules-last-refreshed")).toHaveTextContent(/Last refreshed:/i);
  });
});
