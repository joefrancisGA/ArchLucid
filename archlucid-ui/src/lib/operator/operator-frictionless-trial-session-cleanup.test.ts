import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FRICTIONLESS_TRIAL_SESSION_STORAGE_KEY } from "@/lib/frictionless-trial-session";
import { clearFrictionlessTrialSessionForAuthenticatedOperator } from "@/lib/operator/operator-frictionless-trial-session-cleanup";
import { clearOidcSession, isLikelySignedIn, persistTokenResponse } from "@/lib/oidc/session";

describe("clearFrictionlessTrialSessionForAuthenticatedOperator", () => {
  beforeEach(() => {
    clearOidcSession();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    clearOidcSession();
    localStorage.clear();
  });

  it("removes frictionless session flag when operator is signed in", () => {
    persistTokenResponse({
      access_token: "signed-in-access-token",
      token_type: "Bearer",
      expires_in: 3600,
    });
    localStorage.setItem(FRICTIONLESS_TRIAL_SESSION_STORAGE_KEY, "1");
    expect(isLikelySignedIn()).toBe(true);

    clearFrictionlessTrialSessionForAuthenticatedOperator();

    expect(localStorage.getItem(FRICTIONLESS_TRIAL_SESSION_STORAGE_KEY)).toBeNull();
  });

  it("leaves frictionless session flag when visitor is not signed in", () => {
    localStorage.setItem(FRICTIONLESS_TRIAL_SESSION_STORAGE_KEY, "1");
    expect(isLikelySignedIn()).toBe(false);

    clearFrictionlessTrialSessionForAuthenticatedOperator();

    expect(localStorage.getItem(FRICTIONLESS_TRIAL_SESSION_STORAGE_KEY)).toBe("1");
  });
});
