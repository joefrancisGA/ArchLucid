import { describe, expect, it } from "vitest";

import { parseAuthMe429RetryMs, parseInvitationRetryAfterMs } from "./live-private-beta-access";

describe("private-beta invitation validation retry policy", () => {
  it("honors a numeric Retry-After value with a one-second safety margin", () => {
    expect(parseInvitationRetryAfterMs("2")).toBe(3_000);
  });

  it("caps a long server Retry-After value at the bounded retry ceiling", () => {
    expect(parseInvitationRetryAfterMs("900")).toBe(60_000);
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

describe("private-beta /me proxy 429 retry policy", () => {
  it("honors the proxy body retry copy with a one-second safety margin", () => {
    expect(
      parseAuthMe429RetryMs(
        '{"title":"Too many requests","detail":"Too many requests. Try again in 15 second(s)."}',
      ),
    ).toBe(16_000);
  });

  it("caps a long body retry delay at the bounded retry ceiling", () => {
    expect(parseAuthMe429RetryMs("Try again in 900 second(s).")).toBe(60_000);
  });

  it("uses a bounded fallback when the 429 body omits a delay", () => {
    expect(parseAuthMe429RetryMs('{"title":"Too many requests"}')).toBe(15_000);
  });
});
