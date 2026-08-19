import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  AlertRulesHubRefreshProvider,
  useAlertRulesHubRefresh,
} from "./alerts-hub-refresh-context";
import { OPERATOR_NOT_REFRESHED_LABEL } from "@/lib/operator/operator-last-refreshed-label";

function Probe(): React.JSX.Element {
  const { lastRefreshedAt, reportTabLoaded, registerTabLoader, tabCounts } = useAlertRulesHubRefresh();

  return (
    <div>
      <span data-testid="freshness">
        {lastRefreshedAt === null ? OPERATOR_NOT_REFRESHED_LABEL : "refreshed"}
      </span>
      <span data-testid="tab-count">{tabCounts.notifications ?? "unset"}</span>
      <span data-testid="test-alerts-count">{tabCounts["test-alerts"] ?? "unset"}</span>
      <button type="button" onClick={() => reportTabLoaded("notifications", 3)}>
        report-notifications
      </button>
      <button type="button" onClick={() => reportTabLoaded("rules", 2, null)}>
        report-rules
      </button>
      <button
        type="button"
        onClick={() => {
          registerTabLoader("notifications", async () => {
            /* noop */
          });
        }}
      >
        register
      </button>
    </div>
  );
}

describe("alerts-hub-refresh-context", () => {
  it("initializes hub tab counts unset until a tab reports load", () => {
    render(
      <AlertRulesHubRefreshProvider activeTab="rules">
        <Probe />
      </AlertRulesHubRefreshProvider>,
    );

    expect(screen.getByTestId("tab-count")).toHaveTextContent("unset");
    expect(screen.getByTestId("test-alerts-count")).toHaveTextContent("unset");
  });

  it("stamps freshness and tab counts when the active tab reports a successful load", () => {
    render(
      <AlertRulesHubRefreshProvider activeTab="notifications">
        <Probe />
      </AlertRulesHubRefreshProvider>,
    );

    expect(screen.getByTestId("freshness")).toHaveTextContent(OPERATOR_NOT_REFRESHED_LABEL);

    act(() => {
      screen.getByRole("button", { name: "report-notifications" }).click();
    });

    expect(screen.getByTestId("freshness")).toHaveTextContent("refreshed");
    expect(screen.getByTestId("tab-count")).toHaveTextContent("3");
  });

  it("stores tab counts from inactive tabs without stamping freshness", () => {
    render(
      <AlertRulesHubRefreshProvider activeTab="rules">
        <Probe />
      </AlertRulesHubRefreshProvider>,
    );

    act(() => {
      screen.getByRole("button", { name: "report-notifications" }).click();
    });

    expect(screen.getByTestId("freshness")).toHaveTextContent(OPERATOR_NOT_REFRESHED_LABEL);
    expect(screen.getByTestId("tab-count")).toHaveTextContent("3");
  });

  it("mirrors rules count onto the test-alerts tab", () => {
    render(
      <AlertRulesHubRefreshProvider activeTab="rules">
        <Probe />
      </AlertRulesHubRefreshProvider>,
    );

    act(() => {
      screen.getByRole("button", { name: "report-rules" }).click();
    });

    expect(screen.getByTestId("test-alerts-count")).toHaveTextContent("2");
  });

  it("clears freshness when the active hub tab changes", () => {
    const { rerender } = render(
      <AlertRulesHubRefreshProvider activeTab="notifications">
        <Probe />
      </AlertRulesHubRefreshProvider>,
    );

    act(() => {
      screen.getByRole("button", { name: "report-notifications" }).click();
    });

    expect(screen.getByTestId("freshness")).toHaveTextContent("refreshed");

    rerender(
      <AlertRulesHubRefreshProvider activeTab="rules">
        <Probe />
      </AlertRulesHubRefreshProvider>,
    );

    expect(screen.getByTestId("freshness")).toHaveTextContent(OPERATOR_NOT_REFRESHED_LABEL);
  });

  it("stamps freshness after requestRefresh completes the registered loader", async () => {
    const loader = vi.fn(async () => {
      /* noop */
    });

    function RefreshProbe(): React.JSX.Element {
      const { lastRefreshedAt, requestRefresh, registerTabLoader } = useAlertRulesHubRefresh();

      return (
        <div>
          <span data-testid="freshness">
            {lastRefreshedAt === null ? OPERATOR_NOT_REFRESHED_LABEL : "refreshed"}
          </span>
          <button
            type="button"
            onClick={() => {
              registerTabLoader("notifications", loader);
            }}
          >
            register
          </button>
          <button type="button" onClick={requestRefresh}>
            refresh
          </button>
        </div>
      );
    }

    render(
      <AlertRulesHubRefreshProvider activeTab="notifications">
        <RefreshProbe />
      </AlertRulesHubRefreshProvider>,
    );

    act(() => {
      screen.getByRole("button", { name: "register" }).click();
    });

    await act(async () => {
      screen.getByRole("button", { name: "refresh" }).click();
    });

    expect(loader).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("freshness")).toHaveTextContent("refreshed");
  });
});
