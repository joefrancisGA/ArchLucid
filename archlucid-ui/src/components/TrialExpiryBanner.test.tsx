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

import { TrialExpiryBanner } from "@/components/TrialExpiryBanner";

describe("TrialExpiryBanner", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(JSON.stringify({ status: "Active", daysRemaining: 5 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }),
    );

    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it("renders when trial is active and days remaining is within urgent window", async () => {
    render(<TrialExpiryBanner />);

    await waitFor(() => {
      expect(screen.getByTestId("trial-expiry-banner")).toBeInTheDocument();
    });

    expect(screen.getByRole("region", { name: /trial ending soon/i })).toHaveTextContent(/5 days left on your trial/i);
    expect(screen.getByRole("link", { name: /talk to us/i })).toHaveAttribute("href", "/pricing#pricing-quote-request");
  });

  it("does not render when session dismissed", async () => {
    sessionStorage.setItem("archlucid_trial_expiry_banner_dismissed_session", "1");
    render(<TrialExpiryBanner />);

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("trial-expiry-banner")).not.toBeInTheDocument();
  });

  it("dismiss sets session flag and hides banner", async () => {
    render(<TrialExpiryBanner />);

    await waitFor(() => {
      expect(screen.getByTestId("trial-expiry-banner")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /dismiss trial countdown for this session/i }));

    await waitFor(() => {
      expect(screen.queryByTestId("trial-expiry-banner")).not.toBeInTheDocument();
    });

    expect(sessionStorage.getItem("archlucid_trial_expiry_banner_dismissed_session")).toBe("1");
  });

  it("does not render when more than 7 days remain", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(JSON.stringify({ status: "Active", daysRemaining: 14 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }),
    );

    render(<TrialExpiryBanner />);

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("trial-expiry-banner")).not.toBeInTheDocument();
  });
});
