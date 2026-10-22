import { describe, expect, it } from "vitest";

import {
  buildSignupVerifyViewModel,
  SIGNUP_VERIFY_BANNED_CUSTOMER_STRINGS,
} from "@/lib/signup-verify-present";
import { SIGNUP_VERIFY_PAGE_COPY } from "@/lib/signup-verify-page-copy";

const registration = {
  tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  defaultWorkspaceId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  defaultProjectId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
  adminEmail: "fresh.tenant@example.com",
  organizationName: "Contoso",
};

describe("buildSignupVerifyViewModel", () => {
  it("shows verification pending with masked email in body", () => {
    const model = buildSignupVerifyViewModel({
      registration,
      queryEmail: "",
      trialStatus: { kind: "unauthorized" },
      resendCooldown: { active: false, secondsRemaining: 0 },
      checking: false,
      resendPending: false,
      resendOutcome: null,
      stillPendingAfterCheck: false,
      initialLoadFailed: false,
    });

    expect(model.phase).toBe("verification_pending");
    expect(model.body).toContain("f***@example.com");
    expect(model.primaryLabel).toBe(SIGNUP_VERIFY_PAGE_COPY.primaryPending);
    expect(model.showResend).toBe(true);
  });

  it("redirect-ready when trial workspace is provisioned", () => {
    const model = buildSignupVerifyViewModel({
      registration,
      queryEmail: "",
      trialStatus: {
        kind: "ready",
        payload: { status: "Active", trialSampleRunId: "run-1" },
      },
      resendCooldown: { active: false, secondsRemaining: 0 },
      checking: false,
      resendPending: false,
      resendOutcome: null,
      stillPendingAfterCheck: false,
      initialLoadFailed: false,
    });

    expect(model.phase).toBe("verification_complete");
    expect(model.autoContinue).toBe(true);
    expect(model.primaryLabel).toBe(SIGNUP_VERIFY_PAGE_COPY.primaryVerified);
  });

  it("handles missing signup session", () => {
    const model = buildSignupVerifyViewModel({
      registration: null,
      queryEmail: "ops@example.com",
      trialStatus: null,
      resendCooldown: { active: false, secondsRemaining: 0 },
      checking: false,
      resendPending: false,
      resendOutcome: null,
      stillPendingAfterCheck: false,
      initialLoadFailed: false,
    });

    expect(model.phase).toBe("missing_session");
    expect(model.primaryLabel).toBe(SIGNUP_VERIFY_PAGE_COPY.primarySessionExpired);
  });

  it("handles existing account recovery", () => {
    const model = buildSignupVerifyViewModel({
      registration: { ...registration, wasAlreadyProvisioned: true },
      queryEmail: "",
      trialStatus: null,
      resendCooldown: { active: false, secondsRemaining: 0 },
      checking: false,
      resendPending: false,
      resendOutcome: null,
      stillPendingAfterCheck: false,
      initialLoadFailed: false,
    });

    expect(model.phase).toBe("existing_account");
    expect(model.showSignIn).toBe(false);
    expect(model.primaryLabel).toBe(SIGNUP_VERIFY_PAGE_COPY.primaryExistingAccount);
  });

  it("shows still-pending copy after a failed continue check", () => {
    const model = buildSignupVerifyViewModel({
      registration,
      queryEmail: "",
      trialStatus: { kind: "pending", payload: { status: "None" } },
      resendCooldown: { active: false, secondsRemaining: 0 },
      checking: false,
      resendPending: false,
      resendOutcome: null,
      stillPendingAfterCheck: true,
      initialLoadFailed: false,
    });

    expect(model.phase).toBe("still_pending");
    expect(model.body).toBe(SIGNUP_VERIFY_PAGE_COPY.stillPendingBody);
  });

  it("shows resend cooldown without exposing rate-limit wording", () => {
    const model = buildSignupVerifyViewModel({
      registration,
      queryEmail: "",
      trialStatus: { kind: "unauthorized" },
      resendCooldown: { active: true, secondsRemaining: 45 },
      checking: false,
      resendPending: false,
      resendOutcome: null,
      stillPendingAfterCheck: false,
      initialLoadFailed: false,
    });

    expect(model.phase).toBe("resend_cooldown");
    expect(model.statusMessage).toContain("45 seconds");
    expect(model.statusMessage?.toLowerCase()).not.toContain("rate limit");
  });

  it("uses a distinct rate_limited phase for throttled trial-status", () => {
    const model = buildSignupVerifyViewModel({
      registration,
      queryEmail: "",
      trialStatus: { kind: "throttled" },
      resendCooldown: { active: false, secondsRemaining: 0 },
      checking: false,
      resendPending: false,
      resendOutcome: null,
      stillPendingAfterCheck: false,
      initialLoadFailed: false,
    });

    expect(model.phase).toBe("rate_limited");
    expect(model.heading).toBe(SIGNUP_VERIFY_PAGE_COPY.rateLimitedHeading);
    expect(model.body).toBe(SIGNUP_VERIFY_PAGE_COPY.rateLimitedBody);
    expect(model.primaryDisabled).toBe(true);
    expect(model.showSignIn).toBe(true);
    expect(model.heading.toLowerCase()).not.toContain("rate limit");
    expect(model.body.toLowerCase()).not.toContain("rate limit");
  });
});

describe("SIGNUP_VERIFY_BANNED_CUSTOMER_STRINGS", () => {
  it("does not appear in customer copy constants", () => {
    const haystack = Object.values(SIGNUP_VERIFY_PAGE_COPY).join(" ").toLowerCase();

    for (const banned of SIGNUP_VERIFY_BANNED_CUSTOMER_STRINGS) {
      expect(haystack).not.toContain(banned.toLowerCase());
    }
  });
});
