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

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import SystemHealthPage from "./page";
import { isShowSystemAdministrationNavEnabled } from "@/lib/features";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

/** Healthy overall status with one degraded dependency — the reconciliation case. */
function healthFetchMock() {
  return vi.fn(async (url: string | URL) => {
    const s = String(url);

    if (s.includes("health/live")) {
      return jsonResponse({ status: "Healthy" });
    }

    if (s.includes("health/ready")) {
      return jsonResponse({
        status: "Healthy",
        entries: [
          { name: "database", status: "Healthy", durationMs: 8 },
          { name: "openai", status: "Healthy", durationMs: 120 },
          { name: "redis", status: "Degraded" },
        ],
      });
    }

    if (s.includes("/version")) {
      return jsonResponse({ informationalVersion: "9.9.9+test", commitSha: "deadbeef" });
    }

    return new Response("n", { status: 404 });
  });
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
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "System health" })).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("qualifies the healthy headline and hoists the degraded dependency above the healthy majority", async () => {
    vi.stubGlobal("fetch", healthFetchMock());

    render(<SystemHealthPage />);

    await waitFor(() => {
      expect(screen.getByTestId("system-health-needs-attention")).toBeInTheDocument();
    });

    // Overall status is Healthy while Redis is Degraded — the hero must say so.
    expect(screen.getByTestId("system-health-overall-badge-qualifier")).toHaveTextContent(
      /1 check needs attention/i,
    );

    const needsAttention = screen.getByTestId("system-health-needs-attention");

    expect(within(needsAttention).getByText("Distributed cache (Redis)")).toBeInTheDocument();
    expect(within(needsAttention).queryByText("Primary database")).toBeNull();

    vi.unstubAllGlobals();
  });

  it("summarises readiness groups in a table with counts and probe latency", async () => {
    vi.stubGlobal("fetch", healthFetchMock());

    render(<SystemHealthPage />);

    await waitFor(() => {
      expect(screen.getByTestId("system-health-ready-groups")).toBeInTheDocument();
    });

    const readiness = screen.getByTestId("system-health-ready-groups");
    const table = within(readiness).getByRole("table", { name: /readiness checks by group/i });

    expect(within(table).getByRole("columnheader", { name: "Slowest probe" })).toBeInTheDocument();
    expect(within(table).getByText("Data stores")).toBeInTheDocument();
    expect(within(table).getByText("1 of 2 passing")).toBeInTheDocument();
    expect(within(readiness).getByText("Show all 3 checks")).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("keeps escalation links visible and drops the status-only overall tile", async () => {
    vi.stubGlobal("fetch", healthFetchMock());

    render(<SystemHealthPage />);

    await waitFor(() => {
      expect(screen.getByTestId("system-health-related-surfaces")).toBeInTheDocument();
    });

    const relatedSurfaces = screen.getByTestId("system-health-related-surfaces");

    expect(within(relatedSurfaces).getByRole("link", { name: "Connection status" })).toBeInTheDocument();
    expect(within(relatedSurfaces).getByRole("link", { name: "Troubleshooting help" })).toBeInTheDocument();
    // Internal-only surface stays hidden when the system administration nav is off.
    expect(within(relatedSurfaces).queryByRole("link", { name: "Diagnostics dashboard" })).toBeNull();

    expect(screen.queryByTestId("system-health-summary-tiles-overall")).toBeNull();
    expect(screen.getByTestId("system-health-summary-tiles-readiness")).toHaveTextContent("2 of 3 passing");

    vi.unstubAllGlobals();
  });

  it("gives every Technical details disclosure a distinct accessible name", async () => {
    vi.stubGlobal("fetch", healthFetchMock());

    render(<SystemHealthPage />);

    await waitFor(() => {
      expect(screen.getByTestId("system-health-dependencies-table")).toBeInTheDocument();
    });

    expect(
      screen.getByLabelText("Technical details — Distributed cache (Redis) (needs attention)"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Technical details — Distributed cache (Redis) (critical dependencies)"),
    ).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("pairs an absolute timestamp and the refresh policy with the Refresh control", async () => {
    vi.stubGlobal("fetch", healthFetchMock());

    render(<SystemHealthPage />);

    await waitFor(() => {
      expect(screen.getByTestId("system-health-dependencies-table")).toBeInTheDocument();
    });

    const headerActions = screen.getByTestId("system-health-header-actions");
    const timestamp = within(headerActions).getByTestId("system-health-refresh-timestamp");

    expect(timestamp).toHaveTextContent(/Last refreshed:/i);
    expect(timestamp).toHaveTextContent(/Manual refresh only/i);
    expect(within(headerActions).getByTestId("system-health-refresh")).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("renders a demo-safe system health dashboard in the buyer-polished shell", async () => {
    buyerPolishedShellVitestOverride.value = true;
    vi.mocked(isShowSystemAdministrationNavEnabled).mockReturnValue(false);

    render(<SystemHealthPage />);

    expect(screen.getByTestId("system-health-demo-page")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "System health" })).toBeInTheDocument();
    expect(screen.getByText(/Confirm platform readiness for review workflows/i)).toBeInTheDocument();
    expect(screen.getByTestId("system-health-demo-overall-badge")).toBeInTheDocument();
    expect(screen.getByText(/Ready for pilot review workflows/i)).toBeInTheDocument();
    expect(screen.getByTestId("system-health-demo-scope-note")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.queryByTestId("system-health-demo-context-note")).toBeNull();
    expect(screen.queryByTestId("system-health-claim-discipline")).toBeNull();
    expect(screen.queryByText(/sample review shell/i)).toBeNull();
    expect(screen.queryByText(/CPA SOC 2/i)).toBeNull();
    expect(screen.getByTestId("system-health-summary-tiles")).toBeInTheDocument();
    expect(screen.queryByText("Demo limitations")).toBeNull();
    expect(screen.getByTestId("system-health-operational-checks")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.getByTestId("system-health-refresh-timestamp")).toHaveTextContent(/Last refreshed:/i);

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    // The label stays "Refresh" while in flight so the header does not reflow;
    // aria-busy carries the state instead.
    expect(screen.getByRole("button", { name: "Refresh" })).toHaveAttribute("aria-busy", "true");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Refresh" })).toHaveAttribute("aria-busy", "false");
    });
  });
});
