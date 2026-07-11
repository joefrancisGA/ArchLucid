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

import { AlertRulesHubClient } from "./AlertRulesHubClient";

describe("AlertRulesHubClient", () => {
  beforeEach(() => {
    push.mockReset();
    tabValue.current = null;
  });

  it("defaults to alert rules tab with visible tablist", () => {
    render(<AlertRulesHubClient />);
    expect(screen.getByTestId("stub-rules")).toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-hub-tab-rules")).toHaveTextContent("Alert rules");
    expect(screen.getByRole("tab", { name: "Alert rules" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
  });

  it("shows routing when ?tab=routing", () => {
    tabValue.current = "routing";
    render(<AlertRulesHubClient />);
    expect(screen.getByTestId("stub-routing")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Routing" })).toHaveAttribute("aria-selected", "true");
  });
});
