import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { markEmailOtpResendSent, readEmailOtpResendCooldown } from "@/lib/auth/email-otp-resend";
import {
  clearEmailOtpChallengeSession,
  storeEmailOtpChallengeSession,
} from "@/lib/auth/email-otp-session";

describe("email-otp-session", () => {
  beforeEach(() => {
    vi.stubGlobal("sessionStorage", {
      store: new Map<string, string>(),
      getItem(key: string) {
        return this.store.get(key) ?? null;
      },
      setItem(key: string, value: string) {
        this.store.set(key, value);
      },
      removeItem(key: string) {
        this.store.delete(key);
      },
      clear() {
        this.store.clear();
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("leaves resend cooldown sessionStorage when challenge session is cleared (UX throttle is orthogonal)", () => {
    const now = 1_700_000_000_000;
    storeEmailOtpChallengeSession("challenge-1", "a***@example.com", "a@example.com");
    markEmailOtpResendSent(now);

    clearEmailOtpChallengeSession();

    expect(readEmailOtpResendCooldown(now + 1_000).active).toBe(true);
  });
});
