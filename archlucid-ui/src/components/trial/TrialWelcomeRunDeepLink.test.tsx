import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth-config", () => ({
  AUTH_MODE: "development-bypass",
}));

vi.mock("@/lib/oidc/config", () => ({
  isJwtAuthMode: () => false,
}));

vi.mock("@/lib/oidc/session", () => ({
  isLikelySignedIn: () => true,
}));

import {
  TrialWelcomeRunDeepLink,
  TRIAL_WELCOME_HOME_REDIRECT_SUPPRESS_VALUE,
} from "@/components/trial/TrialWelcomeRunDeepLink";

describe("TrialWelcomeRunDeepLink", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.stubGlobal("location", {
      assign: vi.fn(),
      replace: vi.fn(),
      href: "http://localhost/",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    window.sessionStorage.clear();
  });

  it("hard-redirects once to /architecture/reviews/{id} when trialWelcomeRunId is present", async () => {
    const welcomeId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(JSON.stringify({ trialWelcomeRunId: welcomeId }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }),
    );

    render(<TrialWelcomeRunDeepLink />);

    await waitFor(() => {
      expect(window.location.replace).toHaveBeenCalledWith(`/architecture/reviews/${welcomeId}`);
    });

    expect(window.sessionStorage.getItem("archlucid_trial_welcome_home_redirect_v1")).toBe(welcomeId);
  });

  it("does not redirect when session already recorded the same welcome run id", async () => {
    const welcomeId = "bbbbbbbb-cccc-dddd-eeee-ffffffffffff";
    window.sessionStorage.setItem("archlucid_trial_welcome_home_redirect_v1", welcomeId);

    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ trialWelcomeRunId: welcomeId }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<TrialWelcomeRunDeepLink />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    expect(window.location.replace).not.toHaveBeenCalled();
  });

  it("does not redirect when session carries the e2e suppress sentinel", async () => {
    const welcomeId = "cccccccc-dddd-eeee-ffff-000000000000";
    window.sessionStorage.setItem(
      "archlucid_trial_welcome_home_redirect_v1",
      TRIAL_WELCOME_HOME_REDIRECT_SUPPRESS_VALUE,
    );

    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ trialWelcomeRunId: welcomeId }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<TrialWelcomeRunDeepLink />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    expect(window.location.replace).not.toHaveBeenCalled();
  });
});
