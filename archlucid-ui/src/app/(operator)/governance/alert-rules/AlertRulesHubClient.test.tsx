import { render, screen } from "@testing-library/react";
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

import { AlertRulesHubClient } from "./AlertRulesHubClient";

describe("AlertRulesHubClient", () => {
  beforeEach(() => {
    push.mockReset();
    tabValue.current = null;
  });

  it("defaults to conditions tab with Alert Rules page title", () => {
    render(<AlertRulesHubClient />);
    expect(screen.getByTestId("stub-rules")).toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-page-title")).toHaveTextContent("Alert Rules");
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
    expect(screen.queryByTestId("alert-routing-sources")).toBeNull(); // TB-2092
    expect(screen.getByTestId("alert-routing-claim-discipline")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Notifications/i })).toHaveAttribute("aria-selected", "true");
  });

  it("hides routing Evidence strip on the Conditions tab", () => {
    render(<AlertRulesHubClient />);
    expect(screen.queryByTestId("alert-routing-sources")).not.toBeInTheDocument();
  });
});
