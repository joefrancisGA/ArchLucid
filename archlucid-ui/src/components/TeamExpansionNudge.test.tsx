import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buyerPolishedShellVitestOverride,
  extendBuyerPolishedShellVitestMock,
} from "@/testing/buyer-polished-shell-vitest-override";

vi.mock("@/lib/demo-ui-env", async (importOriginal) =>
  extendBuyerPolishedShellVitestMock(importOriginal),
);

import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

vi.mock("@/lib/auth-config", () => ({
  AUTH_MODE: "development-bypass",
}));

vi.mock("@/lib/oidc/config", () => ({
  isJwtAuthMode: () => false,
}));

vi.mock("@/lib/oidc/session", () => ({
  isLikelySignedIn: () => false,
}));

vi.mock("@/lib/team-expansion-nudge-telemetry", () => ({
  recordTeamExpansionNudgeShown: vi.fn(),
  recordTeamExpansionNudgeClicked: vi.fn(),
}));

import { recordTeamExpansionNudgeClicked, recordTeamExpansionNudgeShown } from "@/lib/team-expansion-nudge-telemetry";
import { TeamExpansionNudge } from "@/components/TeamExpansionNudge";
import { invalidateTenantTrialStatusCache } from "@/lib/tenant-trial-status-client";
import { invalidateTenantUsageStatusCache } from "@/lib/tenant-usage-status-client";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";

const mockShown = vi.mocked(recordTeamExpansionNudgeShown);
const mockClicked = vi.mocked(recordTeamExpansionNudgeClicked);

function mockOperatorShellFetch(args: {
  readonly trialStatus?: Record<string, unknown>;
  readonly usageStatus?: Record<string, unknown>;
}): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.includes("/tenant/trial-status")) {
        return new Response(JSON.stringify(args.trialStatus ?? { status: "None" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("/tenant/usage-status")) {
        return new Response(JSON.stringify(args.usageStatus ?? {}), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    }),
  );
}

describe("TeamExpansionNudge", () => {
  beforeEach(async () => {
    buyerPolishedShellVitestOverride.value = false;
    resetOperatorQueryClientForTests();
    await invalidateTenantTrialStatusCache();
    await invalidateTenantUsageStatusCache();
    vi.stubEnv("NEXT_PUBLIC_OPERATOR_EXPERIENCE", "operator");
    sessionStorage.clear();
    localStorage.clear();
    mockShown.mockClear();
    mockClicked.mockClear();
  });

  afterEach(() => {
    buyerPolishedShellVitestOverride.value = null;
    cleanup();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    sessionStorage.clear();
    localStorage.clear();
  });

  it("does not render for trial tenants", async () => {
    mockOperatorShellFetch({
      trialStatus: { status: "Active" },
      usageStatus: {
        isTrial: true,
        commercialTier: null,
        seatsUsed: 4,
        seatsLimit: 5,
      },
    });

    renderWithOperatorQuery(<TeamExpansionNudge />);

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });

    expect(
      vi.mocked(fetch).mock.calls.some(([input]) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

        return url.includes("/tenant/usage-status");
      }),
    ).toBe(false);
    expect(screen.queryByTestId("team-expansion-nudge")).not.toBeInTheDocument();
  });

  it("renders workspace trigger and links to pricing with team-expansion query params", async () => {
    mockOperatorShellFetch({
      trialStatus: { status: "None" },
      usageStatus: {
        isTrial: false,
        commercialTier: "Team",
        workspacesUsed: 1,
        workspacesLimit: 1,
        seatsUsed: 2,
        seatsLimit: 5,
      },
    });

    renderWithOperatorQuery(<TeamExpansionNudge />);

    await waitFor(() => {
      expect(screen.getByTestId("team-expansion-nudge")).toBeInTheDocument();
    });

    expect(screen.getByTestId("team-expansion-nudge")).toHaveAttribute("data-trigger", "workspaces");
    expect(screen.getByRole("link", { name: /request a quote/i })).toHaveAttribute(
      "href",
      "/pricing?source=team-expansion&trigger=workspaces#pricing-quote-request",
    );
    expect(mockShown).toHaveBeenCalledWith("workspaces");
  });

  it("does not render for Professional tenants", async () => {
    mockOperatorShellFetch({
      trialStatus: { status: "None" },
      usageStatus: {
        isTrial: false,
        commercialTier: "Professional",
        seatsUsed: 18,
        seatsLimit: 20,
      },
    });

    renderWithOperatorQuery(<TeamExpansionNudge />);

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("team-expansion-nudge")).not.toBeInTheDocument();
  });

  it("dismiss snoozes for 24 hours and records click telemetry", async () => {
    mockOperatorShellFetch({
      trialStatus: { status: "None" },
      usageStatus: {
        isTrial: false,
        commercialTier: "Team",
        seatsUsed: 4,
        seatsLimit: 5,
        workspacesUsed: 1,
        workspacesLimit: 1,
      },
    });

    renderWithOperatorQuery(<TeamExpansionNudge />);

    await waitFor(() => {
      expect(screen.getByTestId("team-expansion-nudge")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("link", { name: /request a quote/i }));
    expect(mockClicked).toHaveBeenCalledWith("workspaces");

    fireEvent.click(screen.getByRole("button", { name: /dismiss team expansion nudge for 24 hours/i }));

    await waitFor(() => {
      expect(screen.queryByTestId("team-expansion-nudge")).not.toBeInTheDocument();
    });

    expect(localStorage.getItem("archlucid_team_expansion_nudge_dismiss_until_workspaces")).not.toBeNull();
  });
});
