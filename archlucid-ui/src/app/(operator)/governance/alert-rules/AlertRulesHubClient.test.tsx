import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const tabValue: { current: string | null } = { current: null };
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => ({
    get: (k: string) => (k === "tab" ? tabValue.current : null),
  }),
}));

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

vi.mock("@/components/alerts/AlertRulesContent", () => ({
  AlertRulesContent: () => <div data-testid="stub-rules" />,
}));
vi.mock("@/components/alerts/AlertRoutingContent", () => ({
  AlertRoutingContent: () => <div data-testid="stub-routing" />,
}));
vi.mock("@/components/alerts/CompositeAlertRulesContent", () => ({
  CompositeAlertRulesContent: () => <div data-testid="stub-composite" />,
}));
vi.mock("@/components/alerts/AlertSimulationTuningSection", () => ({
  AlertSimulationTuningSection: () => <div data-testid="stub-simulation" />,
}));

import { ALERTS_CONFIGURATION_PAGE_SUBTITLE } from "@/lib/alerts-page-copy";

import { AlertRulesHubClient } from "./AlertRulesHubClient";

describe("AlertRulesHubClient", () => {
  beforeEach(() => {
    push.mockReset();
    tabValue.current = null;
  });

  it("defaults to conditions tab with Alerts page title", () => {
    render(<AlertRulesHubClient />);
    expect(screen.getByTestId("stub-rules")).toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-page-title")).toHaveTextContent("Alerts");
    expect(screen.getByText(ALERTS_CONFIGURATION_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-last-refreshed")).toHaveTextContent(/Last refreshed:/i);
    expect(screen.getByTestId("alert-rules-open-inbox-link")).toHaveAttribute("href", "/governance/alerts");
    expect(screen.getByTestId("alert-rules-hub-tab-rules")).toHaveTextContent("Conditions");
    expect(screen.getByRole("tab", { name: /Conditions/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
  });

  it("shows notifications when ?tab=routing", () => {
    tabValue.current = "routing";
    render(<AlertRulesHubClient />);
    expect(screen.getByTestId("stub-routing")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Notifications/i })).toHaveAttribute("aria-selected", "true");
  });
});
