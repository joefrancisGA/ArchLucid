import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth-config", () => ({
  AUTH_MODE: "development-bypass",
}));

vi.mock("@/lib/oidc/config", () => ({
  isJwtAuthMode: () => false,
}));

vi.mock("@/lib/oidc/session", () => ({
  isLikelySignedIn: () => false,
}));

vi.mock("@/lib/trial-upgrade-nudge-telemetry", () => ({
  recordTrialUpgradeNudgeShown: vi.fn(),
  recordTrialUpgradeNudgeClicked: vi.fn(),
}));

import { recordTrialUpgradeNudgeClicked, recordTrialUpgradeNudgeShown } from "@/lib/trial-upgrade-nudge-telemetry";
import { TrialUsageUpgradeNudge } from "@/components/TrialUsageUpgradeNudge";

const mockShown = vi.mocked(recordTrialUpgradeNudgeShown);
const mockClicked = vi.mocked(recordTrialUpgradeNudgeClicked);

describe("TrialUsageUpgradeNudge", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_OPERATOR_EXPERIENCE", "operator");
    sessionStorage.clear();
    localStorage.clear();
    mockShown.mockClear();
    mockClicked.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    sessionStorage.clear();
    localStorage.clear();
  });

  it("does not render in buyer-polished shell", async () => {
    vi.stubEnv("NEXT_PUBLIC_OPERATOR_EXPERIENCE", "");
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "");
    vi.stubEnv("NEXT_PUBLIC_DEMO_STATIC_OPERATOR", "");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            status: "Active",
            daysRemaining: 5,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }),
    );

    render(<TrialUsageUpgradeNudge />);

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("trial-usage-upgrade-nudge")).not.toBeInTheDocument();
  });

  it("renders expiry trigger within three-day window and links to pricing with trial-nudge query params", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            status: "Active",
            daysRemaining: 2,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }),
    );

    render(<TrialUsageUpgradeNudge />);

    await waitFor(() => {
      expect(screen.getByTestId("trial-usage-upgrade-nudge")).toBeInTheDocument();
    });

    expect(screen.getByTestId("trial-usage-upgrade-nudge")).toHaveAttribute("data-trigger", "expiry");
    expect(screen.getByRole("button", { name: /upgrade now/i })).toBeInTheDocument();
    expect(screen.getByTestId("trial-expired-upgrade-modal")).toBeInTheDocument();
    expect(mockShown).toHaveBeenCalledWith("expiry");
  });

  it("does not render expiry trigger outside three-day window", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            status: "Active",
            daysRemaining: 4,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }),
    );

    render(<TrialUsageUpgradeNudge />);

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("trial-usage-upgrade-nudge")).not.toBeInTheDocument();
  });

  it("renders non-dismissible expired trial modal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            status: "Expired",
            daysRemaining: 0,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }),
    );

    render(<TrialUsageUpgradeNudge />);

    await waitFor(() => {
      expect(screen.getByTestId("trial-expired-upgrade-modal")).toBeInTheDocument();
    });

    expect(screen.getByText(/your trial has expired/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /dismiss trial upgrade nudge for 24 hours/i }),
    ).not.toBeInTheDocument();
  });

  it("does not render again in the same session after first show", async () => {
    sessionStorage.setItem("archlucid_trial_upgrade_nudge_session_shown_runs", "1");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            status: "Active",
            daysRemaining: 20,
            trialRunsUsed: 8,
            trialRunsLimit: 10,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }),
    );

    render(<TrialUsageUpgradeNudge />);

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("trial-usage-upgrade-nudge")).not.toBeInTheDocument();
  });

  it("dismiss snoozes for 24 hours and records click telemetry", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            status: "Active",
            daysRemaining: 20,
            trialRunsUsed: 8,
            trialRunsLimit: 10,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }),
    );

    render(<TrialUsageUpgradeNudge />);

    await waitFor(() => {
      expect(screen.getByTestId("trial-usage-upgrade-nudge")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("link", { name: /request a quote/i }));
    expect(mockClicked).toHaveBeenCalledWith("runs");

    fireEvent.click(screen.getByRole("button", { name: /dismiss trial upgrade nudge for 24 hours/i }));

    await waitFor(() => {
      expect(screen.queryByTestId("trial-usage-upgrade-nudge")).not.toBeInTheDocument();
    });

    expect(localStorage.getItem("archlucid_trial_upgrade_nudge_dismiss_until_runs")).not.toBeNull();
  });
});
