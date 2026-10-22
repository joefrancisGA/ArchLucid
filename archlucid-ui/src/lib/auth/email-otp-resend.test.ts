import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  emailOtpResendCooldownMs,
  markEmailOtpResendSent,
  readEmailOtpResendCooldown,
} from "@/lib/auth/email-otp-resend";

describe("email-otp-resend cooldown", () => {
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

  it("treats cleared sessionStorage as no active client cooldown (server 429 remains authoritative)", () => {
    const now = 1_700_000_000_000;
    markEmailOtpResendSent(now);

    expect(readEmailOtpResendCooldown(now + 1_000).active).toBe(true);

    sessionStorage.clear();

    expect(readEmailOtpResendCooldown(now + 2_000).active).toBe(false);
    expect(emailOtpResendCooldownMs()).toBe(45_000);
  });
});
