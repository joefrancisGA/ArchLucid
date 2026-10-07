import { describe, expect, it } from "vitest";

import { parseInvitationRetryAfterMs } from "./live-private-beta-access";

describe("private-beta invitation validation retry policy", () => {
  it("honors a numeric Retry-After value with a one-second safety margin", () => {
    expect(parseInvitationRetryAfterMs("2")).toBe(3_000);
  });

  it("honors an HTTP-date Retry-After value without producing a negative delay", () => {
    const retryAt = new Date(Date.now() + 5_000).toUTCString();

    expect(parseInvitationRetryAfterMs(retryAt)).toBeGreaterThanOrEqual(1_000);
    expect(parseInvitationRetryAfterMs(retryAt)).toBeLessThanOrEqual(60_000);
  });

  it("uses a bounded fallback when the server omits Retry-After", () => {
    expect(parseInvitationRetryAfterMs(undefined)).toBe(15_000);
  });
});
