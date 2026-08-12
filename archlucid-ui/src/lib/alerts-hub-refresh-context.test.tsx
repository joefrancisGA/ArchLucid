import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  AlertRulesHubRefreshProvider,
  useAlertRulesHubRefresh,
} from "./alerts-hub-refresh-context";
import { OPERATOR_NOT_REFRESHED_LABEL } from "@/lib/operator/operator-last-refreshed-label";

function Probe(): React.JSX.Element {
  const { lastRefreshedAt, reportTabLoaded, registerTabLoader } = useAlertRulesHubRefresh();

  return (
    <div>
      <span data-testid="freshness">
        {lastRefreshedAt === null ? OPERATOR_NOT_REFRESHED_LABEL : "refreshed"}
      </span>
      <button type="button" onClick={() => reportTabLoaded("notifications")}>
        report
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
  it("stamps freshness when the active tab reports a successful load", () => {
    render(
      <AlertRulesHubRefreshProvider activeTab="notifications">
        <Probe />
      </AlertRulesHubRefreshProvider>,
    );

    expect(screen.getByTestId("freshness")).toHaveTextContent(OPERATOR_NOT_REFRESHED_LABEL);

    act(() => {
      screen.getByRole("button", { name: "report" }).click();
    });

    expect(screen.getByTestId("freshness")).toHaveTextContent("refreshed");
  });

  it("ignores freshness reports from inactive tabs", () => {
    render(
      <AlertRulesHubRefreshProvider activeTab="rules">
        <Probe />
      </AlertRulesHubRefreshProvider>,
    );

    act(() => {
      screen.getByRole("button", { name: "report" }).click();
    });

    expect(screen.getByTestId("freshness")).toHaveTextContent(OPERATOR_NOT_REFRESHED_LABEL);
  });

  it("clears freshness when the active hub tab changes", () => {
    const { rerender } = render(
      <AlertRulesHubRefreshProvider activeTab="notifications">
        <Probe />
      </AlertRulesHubRefreshProvider>,
    );

    act(() => {
      screen.getByRole("button", { name: "report" }).click();
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
