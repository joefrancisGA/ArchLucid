import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const tabValue: { current: string | null } = { current: null };

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useSearchParams: () => ({
      get: (k: string) => (k === "tab" ? tabValue.current : null),
    }),
    usePathname: () => "/governance/alert-rules",
  };
});

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => false,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: ({ triggerText }: { triggerText?: string }) => (
    <div data-testid="page-contextual-help-button">{triggerText ?? "Help"}</div>
  ),
}));

vi.mock(
  "@/app/(operator)/governance/alert-rules/_sections/alert-rules-hub-deferred-chunks",
  () => ({
    AlertRulesContentDeferred: () => <div data-testid="stub-rules" />,
    AlertRoutingContentDeferred: () => <div data-testid="stub-routing" />,
    CompositeAlertRulesContentDeferred: () => <div data-testid="stub-composite" />,
    AlertSimulationTuningSectionDeferred: () => <div data-testid="stub-simulation" />,
  }),
);

import { ALERTS_CONFIGURATION_PAGE_SUBTITLE } from "@/lib/alerts-page-copy";
import { ALERT_RULES_CONFIG_NEVER_CONFIGURED_LABEL, ALERT_RULES_TAB_LABEL } from "@/lib/alert-rule-conditions-copy";

import { AlertRulesHubClient } from "./AlertRulesHubClient";

describe("AlertRulesHubClient", () => {
  beforeEach(() => {
    tabValue.current = null;
    window.history.replaceState({}, "", "/governance/alert-rules");
  });

  it("defaults to alert rules tab with page title and never-configured provenance at zero rules", () => {
    render(<AlertRulesHubClient />);
    expect(screen.getByTestId("stub-rules")).toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-page-title")).toHaveTextContent("Alert rules");
    expect(screen.getByTestId("page-heading-icon")).toBeInTheDocument();
    expect(screen.getByText(ALERTS_CONFIGURATION_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-config-provenance")).toHaveTextContent(
      ALERT_RULES_CONFIG_NEVER_CONFIGURED_LABEL,
    );
    expect(screen.queryByTestId("alert-rules-last-refreshed")).toBeNull();
    expect(screen.queryByTestId("alert-rules-open-inbox-link")).toBeNull();
    expect(screen.getByTestId("alert-rules-hub-tab-rules")).toHaveTextContent(`${ALERT_RULES_TAB_LABEL} (0)`);
    expect(screen.getByRole("tab", { name: `${ALERT_RULES_TAB_LABEL} (0)` })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("page-contextual-help-button")).toHaveTextContent("Help");
    expect(screen.queryByTestId("governance-setup-config-hubs-vocabulary")).toBeNull();
  });

  it("shows notifications when ?tab=notifications", () => {
    tabValue.current = "notifications";
    render(<AlertRulesHubClient />);
    expect(screen.getByTestId("stub-routing")).toBeInTheDocument();
    expect(screen.queryByTestId("alert-routing-sources")).toBeNull();
    expect(screen.queryByTestId("alert-routing-claim-discipline")).toBeNull();
    expect(screen.getByRole("tab", { name: /Notifications/i })).toHaveAttribute("aria-selected", "true");
  });

  it("shows advanced rules when ?tab=advanced-rules", () => {
    tabValue.current = "advanced-rules";
    render(<AlertRulesHubClient />);
    expect(screen.getByTestId("stub-composite")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Advanced rules/i })).toHaveAttribute("aria-selected", "true");
  });

  it("shows test alerts when ?tab=test-alerts", () => {
    tabValue.current = "test-alerts";
    render(<AlertRulesHubClient />);
    expect(screen.getByTestId("stub-simulation")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Test alerts/i })).toHaveAttribute("aria-selected", "true");
  });

  it("falls back to alert rules for unknown tab ids", () => {
    tabValue.current = "routing";
    render(<AlertRulesHubClient />);
    expect(screen.getByTestId("stub-rules")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Alert rules \(0\)/ })).toHaveAttribute("aria-selected", "true");
  });

  it("hides routing Evidence strip on the alert rules tab", () => {
    render(<AlertRulesHubClient />);
    expect(screen.queryByTestId("alert-routing-sources")).not.toBeInTheDocument();
  });

  it("leads with the page title and no About disclosures above it (TB-2093)", () => {
    render(<AlertRulesHubClient />);

    expect(screen.queryByTestId("layer-header-collapsible-guidance")).toBeNull();
    expect(screen.queryByTestId("alert-rules-scope-details")).toBeNull();
    expect(screen.queryByTestId("layer-header-review-vocabulary")).toBeNull();
  });

  it("omits redundant tab-lead prose under the hub tabs", () => {
    render(<AlertRulesHubClient />);

    expect(screen.queryByTestId("alert-rules-hub-tab-lead-rules")).toBeNull();
    expect(screen.getByRole("tab", { name: /Notifications \(0\)/ })).toHaveAttribute("aria-controls");
  });

  it("moves tab selection with ArrowRight keyboard navigation", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");

    render(<AlertRulesHubClient />);

    const rulesTab = screen.getByRole("tab", { name: /Alert rules \(0\)/ });
    rulesTab.focus();

    fireEvent.keyDown(screen.getByRole("tablist"), { key: "ArrowRight" });

    expect(replaceState).toHaveBeenCalled();
    const lastCall = replaceState.mock.calls.at(-1);
    expect(String(lastCall?.[2])).toContain("tab=notifications");
    expect(screen.getByRole("tab", { name: /Notifications \(0\)/ })).toHaveAttribute("aria-selected", "true");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: /Notifications \(0\)/ }));
  });

  it("shows tab counts on all hub tabs and disables Test alerts at zero rules (P0-5)", () => {
    render(<AlertRulesHubClient />);

    expect(screen.getByRole("tab", { name: /Alert rules \(0\)/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Notifications \(0\)/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Advanced rules \(0\)/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Test alerts \(0\)/ })).toBeDisabled();
    expect(screen.getByTestId("alert-rules-test-alerts-disabled-hint")).toBeInTheDocument();
  });

  it("TB-1663: renders Carbon line-tab chrome on shared Tabs", () => {
    render(<AlertRulesHubClient />);

    const tablist = screen.getByRole("tablist", { name: "Alerts configuration sections" });

    expect(tablist).toHaveAttribute("data-tabs-list");
    expect(tablist.className).toMatch(/border-b/);

    const rulesTab = screen.getByRole("tab", { name: /Alert rules \(0\)/ });

    expect(rulesTab.className).toMatch(/border-b-2/);
    expect(rulesTab.className).not.toMatch(/rounded-full/);
  });
});
