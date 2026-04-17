import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

import { TrialBanner } from "./TrialBanner";

describe("TrialBanner", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(null, { status: 500 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("renders nothing when trial status is None", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(JSON.stringify({ status: "None" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }),
    );

    render(<TrialBanner />);

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });

    expect(screen.queryByRole("region", { name: /Trial subscription/i })).toBeNull();
  });

  it("renders strip for Active with days and posts checkout on convert", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const url = String(input);

      if (url.includes("trial-status")) {
        return new Response(JSON.stringify({ status: "Active", daysRemaining: 7 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("billing/checkout")) {
        return new Response(JSON.stringify({ status: "not_configured" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(null, { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<TrialBanner />);

    await waitFor(() => {
      expect(screen.getByRole("region", { name: /Trial subscription/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/7 days remaining on trial/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Convert to paid/i }));

    await waitFor(() => {
      expect(fetchMock.mock.calls.some((c) => String(c[0]).includes("billing/checkout"))).toBe(true);
    });
  });

  it("hides for 24h after dismiss (snooze)", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ status: "Expired", daysRemaining: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = render(<TrialBanner />);

    await waitFor(() => {
      expect(screen.getByRole("region", { name: /Trial subscription/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Dismiss trial banner for 24 hours/i }));

    await waitFor(() => {
      expect(screen.queryByRole("region", { name: /Trial subscription/i })).not.toBeInTheDocument();
    });

    unmount();
    render(<TrialBanner />);

    await waitFor(() => {
      expect(screen.queryByRole("region", { name: /Trial subscription/i })).not.toBeInTheDocument();
    });
  });
});
