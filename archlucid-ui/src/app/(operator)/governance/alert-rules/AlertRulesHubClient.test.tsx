import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const tabValue: { current: string | null } = { current: null };
const push = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useRouter: () => ({ push }),
    useSearchParams: () => ({
      get: (k: string) => (k === "tab" ? tabValue.current : null),
    }),
    usePathname: () => "/",
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
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
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
import { OPERATOR_NOT_REFRESHED_LABEL } from "@/lib/operator/operator-last-refreshed-label";

import { AlertRulesHubClient } from "./AlertRulesHubClient";

describe("AlertRulesHubClient", () => {
  beforeEach(() => {
    push.mockReset();
    tabValue.current = null;
  });

  it("defaults to conditions tab with Alert rules page title", () => {
    render(<AlertRulesHubClient />);
    expect(screen.getByTestId("stub-rules")).toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-page-title")).toHaveTextContent("Alert rules");
    expect(screen.getByText(ALERTS_CONFIGURATION_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-refresh-button")).toBeInTheDocument();
    // Before any refresh there is no timestamp to qualify, so the prefix is omitted.
    expect(screen.getByTestId("alert-rules-last-refreshed")).toHaveTextContent(
      OPERATOR_NOT_REFRESHED_LABEL,
    );
    expect(screen.getByTestId("alert-rules-last-refreshed")).not.toHaveTextContent(/Last refreshed:/i);
    expect(screen.getByTestId("alert-rules-open-inbox-link")).toHaveAttribute("href", "/governance/alerts");
    expect(screen.getByTestId("alert-rules-hub-tab-rules")).toHaveTextContent("Conditions");
    expect(screen.getByRole("tab", { name: /Conditions/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
  });

  it("shows notifications when ?tab=notifications", () => {
    tabValue.current = "notifications";
    render(<AlertRulesHubClient />);
    expect(screen.getByTestId("stub-routing")).toBeInTheDocument();
    expect(screen.queryByTestId("alert-routing-sources")).toBeNull(); // TB-2092
    expect(screen.queryByTestId("alert-routing-claim-discipline")).toBeNull(); // TB-2092
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

  it("falls back to conditions for unknown tab ids", () => {
    tabValue.current = "routing";
    render(<AlertRulesHubClient />);
    expect(screen.getByTestId("stub-rules")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Conditions/i })).toHaveAttribute("aria-selected", "true");
  });

  it("hides routing Evidence strip on the Conditions tab", () => {
    render(<AlertRulesHubClient />);
    expect(screen.queryByTestId("alert-routing-sources")).not.toBeInTheDocument();
  });

  it("leads with the page title and no About disclosures above it (TB-2093)", () => {
    render(<AlertRulesHubClient />);

    expect(screen.queryByTestId("layer-header-collapsible-guidance")).toBeNull();
    expect(screen.queryByTestId("alert-rules-scope-details")).toBeNull();
    expect(screen.queryByTestId("layer-header-review-vocabulary")).toBeNull();
  });

  it("shows tab subtitles in the visible panel lead instead of title tooltips", () => {
    render(<AlertRulesHubClient />);

    const notificationsTab = screen.getByTestId("alert-rules-hub-tab-notifications");

    expect(notificationsTab).toHaveTextContent("Notifications");
    expect(notificationsTab).not.toHaveAttribute("title");
    expect(screen.getByTestId("alert-rules-hub-tab-lead-rules")).toHaveTextContent(
      "When completed reviews should raise an alert",
    );
    expect(screen.getByRole("tab", { name: "Notifications" })).toHaveAttribute("aria-controls");
  });

  it("moves tab selection with ArrowRight keyboard navigation", () => {
    render(<AlertRulesHubClient />);

    const conditionsTab = screen.getByRole("tab", { name: "Conditions" });
    conditionsTab.focus();

    fireEvent.keyDown(screen.getByRole("tablist"), { key: "ArrowRight" });

    expect(push).toHaveBeenCalledWith("/governance/alert-rules?tab=notifications");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Notifications" }));
  });

  it("TB-1663: renders Carbon line-tab chrome on shared Tabs", () => {
    render(<AlertRulesHubClient />);

    const tablist = screen.getByRole("tablist", { name: "Alerts configuration sections" });

    expect(tablist).toHaveAttribute("data-tabs-list");
    expect(tablist.className).toMatch(/border-b/);

    const conditionsTab = screen.getByRole("tab", { name: "Conditions" });

    expect(conditionsTab.className).toMatch(/border-b-2/);
    expect(conditionsTab.className).not.toMatch(/rounded-full/);
  });
});
