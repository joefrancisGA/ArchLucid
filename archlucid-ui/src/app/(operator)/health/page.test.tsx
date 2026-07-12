import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buyerPolishedShellVitestOverride,
  extendBuyerPolishedShellVitestMock,
} from "@/testing/buyer-polished-shell-vitest-override";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await extendBuyerPolishedShellVitestMock(importOriginal);

  return {
    ...actual,
    isOperatorExperienceFullShellEnv: vi.fn(() => false),
  };
});

vi.mock("@/lib/features", () => ({
  isShowSystemAdministrationNavEnabled: vi.fn(() => false),
}));

import SystemHealthPage from "./page";
import { isShowSystemAdministrationNavEnabled } from "@/lib/features";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

describe("SystemHealthPage", () => {
  beforeEach(() => {
    buyerPolishedShellVitestOverride.value = false;
  });

  afterEach(() => {
    buyerPolishedShellVitestOverride.value = null;
  });

  it("renders liveness, readiness dependencies, version, and uptime", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      const s = String(url);

      if (s.includes("health/live")) {
        return jsonResponse({ status: "Healthy" });
      }

      if (s.includes("health/ready")) {
        return jsonResponse({
          status: "Healthy",
          entries: [
            { name: "database", status: "Healthy" },
            { name: "openai", status: "Healthy" },
            { name: "redis", status: "Degraded" },
          ],
        });
      }

      if (s.includes("/version")) {
        return jsonResponse({
          informationalVersion: "9.9.9+test",
          commitSha: "deadbeef",
          processUptimeSeconds: 3661,
        });
      }

      return new Response("n", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<SystemHealthPage />);

    await waitFor(() => {
      expect(screen.getByTestId("system-health-dependencies-table")).toBeInTheDocument();
    });

    const dependenciesTable = screen.getByTestId("system-health-dependencies-table");

    expect(within(dependenciesTable).getByText("Primary database")).toBeInTheDocument();
    expect(within(dependenciesTable).getByText("AI model service")).toBeInTheDocument();
    expect(within(dependenciesTable).getByText("Distributed cache (Redis)")).toBeInTheDocument();

    const buildDetails = screen.getByTestId("system-health-build-identity");

    fireEvent.click(within(buildDetails).getByText("Build details"));

    expect(within(buildDetails).getByText("9.9.9+test")).toBeInTheDocument();
    expect(within(buildDetails).getByText("1h 1m")).toBeInTheDocument();
    expect(screen.getByText("Application liveness")).toBeInTheDocument();
    expect(screen.getByText("Responding")).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("renders a demo-safe system health dashboard in the buyer-polished shell", async () => {
    buyerPolishedShellVitestOverride.value = true;
    vi.mocked(isShowSystemAdministrationNavEnabled).mockReturnValue(false);

    render(<SystemHealthPage />);

    expect(screen.getByTestId("system-health-demo-page")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "System health" })).toBeInTheDocument();
    expect(screen.getByText(/Monitor platform readiness, service status, integrations/i)).toBeInTheDocument();
    expect(screen.getByTestId("system-health-demo-context-note")).toHaveTextContent(/Demo workspace/i);
    expect(screen.queryByText(/sample review shell/i)).toBeNull();
    expect(screen.getByTestId("system-health-summary-tiles")).toBeInTheDocument();
    expect(screen.getByTestId("system-health-operational-checks")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.getByTestId("system-health-refresh-timestamp")).toHaveTextContent(/Last refreshed:/i);

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    expect(screen.getByRole("button", { name: "Refreshing…" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    });
  });
});
