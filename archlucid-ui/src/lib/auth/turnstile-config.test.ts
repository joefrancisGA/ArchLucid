import { afterEach, describe, expect, it } from "vitest";

import { isTurnstileBotChallengeConfigured, readTurnstileSiteKey } from "@/lib/auth/turnstile-config";

describe("turnstile-config", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  });

  it("returns null when site key is unset", () => {
    expect(readTurnstileSiteKey()).toBeNull();
    expect(isTurnstileBotChallengeConfigured()).toBe(false);
  });

  it("returns trimmed site key when configured", () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "  site-key-test  ";

    expect(readTurnstileSiteKey()).toBe("site-key-test");
    expect(isTurnstileBotChallengeConfigured()).toBe(true);
  });
});
