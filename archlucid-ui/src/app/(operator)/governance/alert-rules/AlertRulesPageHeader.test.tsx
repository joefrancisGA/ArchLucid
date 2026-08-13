import { fireEvent, render, screen } from "@testing-library/react";

import { describe, expect, it, vi } from "vitest";



import { alertsConfigurationPageSubtitle } from "@/lib/alerts-page-copy";

import {

  ALERT_RULES_CONFIG_NEVER_CONFIGURED_LABEL,

  ALERT_RULES_TAB_LABEL,

} from "@/lib/alert-rule-conditions-copy";

import {

  COMPOSITE_RULES_CONFIG_NEVER_CONFIGURED_LABEL,

  COMPOSITE_RULES_TAB_LABEL,

} from "@/lib/enterprise-controls-context-copy";



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



const baseProps = {

  subtitle: alertsConfigurationPageSubtitle(false),

  rulesTabCount: undefined as number | undefined,

  rulesConfigChange: null,

  advancedRulesTabCount: undefined as number | undefined,

  compositeRulesConfigChange: null,

  refreshing: false,

  lastRefreshedAt: null,

  onRefresh: vi.fn(),

};



describe("AlertRulesPageHeader", () => {

  it("renders h1, short help, and icon refresh without provenance before rules load", () => {

    const onRefresh = vi.fn();



    render(

      <AlertRulesPageHeader

        {...baseProps}

        activeTab="rules"

        activeTabLabel={ALERT_RULES_TAB_LABEL}

        onRefresh={onRefresh}

      />,

    );



    expect(screen.getByRole("heading", { level: 2, name: "Alert rules" })).toBeInTheDocument();

    expect(screen.getByTestId("page-heading-icon")).toBeInTheDocument();

    expect(screen.queryByTestId("alert-rules-page-breadcrumb")).toBeNull();

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

        {...baseProps}

        activeTab="rules"

        activeTabLabel={ALERT_RULES_TAB_LABEL}

        rulesTabCount={0}

        lastRefreshedAt={new Date("2026-07-09T12:00:00.000Z")}

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

        {...baseProps}

        activeTab="rules"

        activeTabLabel={ALERT_RULES_TAB_LABEL}

        rulesTabCount={2}

        rulesConfigChange={{ recordedUtc: "2026-07-09T12:00:00.000Z", actor: null }}

        lastRefreshedAt={new Date("2026-07-09T12:00:00.000Z")}

      />,

    );



    expect(screen.getByTestId("alert-rules-config-provenance")).toHaveTextContent(/Configuration last recorded/i);

    expect(screen.getByRole("link", { name: "View audit trail" })).toHaveAttribute("href", "/governance/audit");

  });



  it("hides composite provenance on advanced-rules tab until counts load", () => {
    render(
      <AlertRulesPageHeader
        {...baseProps}
        activeTab="advanced-rules"
        activeTabLabel={COMPOSITE_RULES_TAB_LABEL}
        advancedRulesTabCount={undefined}
        lastRefreshedAt={new Date("2026-07-09T12:00:00.000Z")}
      />,
    );

    expect(screen.queryByTestId("composite-rules-config-provenance")).toBeNull();
    expect(screen.getByTestId("alert-rules-last-refreshed")).toHaveTextContent(/Last refreshed:/i);
  });

  it("shows composite never-configured provenance on advanced-rules tab at zero rules", () => {

    render(

      <AlertRulesPageHeader

        {...baseProps}

        activeTab="advanced-rules"

        activeTabLabel={COMPOSITE_RULES_TAB_LABEL}

        advancedRulesTabCount={0}

        lastRefreshedAt={new Date("2026-07-09T12:00:00.000Z")}

      />,

    );



    expect(screen.getByTestId("composite-rules-config-provenance")).toHaveTextContent(

      COMPOSITE_RULES_CONFIG_NEVER_CONFIGURED_LABEL,

    );

    expect(screen.queryByTestId("alert-rules-page-breadcrumb")).toBeNull();

    expect(screen.getByRole("link", { name: "View audit trail" })).toHaveAttribute("href", "/governance/audit");

  });



  it("shows composite last-configured provenance after composite rules exist", () => {

    render(

      <AlertRulesPageHeader

        {...baseProps}

        activeTab="advanced-rules"

        activeTabLabel={COMPOSITE_RULES_TAB_LABEL}

        advancedRulesTabCount={1}

        compositeRulesConfigChange={{ recordedUtc: "2026-07-09T12:00:00.000Z", actor: null }}

        lastRefreshedAt={new Date("2026-07-09T12:00:00.000Z")}

      />,

    );



    expect(screen.getByTestId("composite-rules-config-provenance")).toHaveTextContent(/Configuration last recorded/i);

  });



  it("shows last-refreshed metadata on non-rules tabs after load", () => {

    render(

      <AlertRulesPageHeader

        {...baseProps}

        activeTab="notifications"

        activeTabLabel="Notifications"

        rulesTabCount={2}

        rulesConfigChange={{ recordedUtc: "2026-07-09T12:00:00.000Z", actor: null }}

        lastRefreshedAt={new Date("2026-07-09T12:00:00.000Z")}

      />,

    );



    expect(screen.queryByTestId("alert-rules-config-provenance")).toBeNull();

    expect(screen.getByTestId("alert-rules-last-refreshed")).toHaveTextContent(/Last refreshed:/i);

  });

});

