import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const tabValue: { current: string | null } = { current: null };
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/governance/alerts",
  useSearchParams: () => ({
    get: (k: string) => (k === "tab" ? tabValue.current : null),
  }),
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => false,
}));

vi.mock("@/components/alerts/AlertsInboxContent", () => ({
  AlertsInboxContent: () => <div data-testid="stub-inbox" />,
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

import { ALERTS_PAGE_SUBTITLE } from "@/lib/alerts-page-copy";
import { AlertsHubClient } from "./AlertsHubClient";

describe("AlertsHubClient", () => {
  beforeEach(() => {
    push.mockReset();
    tabValue.current = null;
  });

  it("shows inbox by default (no ?tab=)", () => {
    render(<AlertsHubClient />);
    expect(screen.getByTestId("stub-inbox")).toBeInTheDocument();
    expect(screen.getByTestId("alerts-page-title")).toHaveTextContent("Alerts");
    expect(screen.getByText(ALERTS_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("alerts-governance-context-panel")).toBeInTheDocument();
    expect(screen.queryByText("Alerts — where to start")).not.toBeInTheDocument();
  });

  it("shows rules when ?tab=rules", () => {
    tabValue.current = "rules";
    render(<AlertsHubClient />);
    expect(screen.getByTestId("stub-rules")).toBeInTheDocument();
    expect(screen.queryByTestId("alerts-governance-context-panel")).not.toBeInTheDocument();
  });

  it("falls back to inbox for unknown ?tab= values", () => {
    tabValue.current = "nope";
    render(<AlertsHubClient />);
    expect(screen.getByTestId("stub-inbox")).toBeInTheDocument();
  });
});
