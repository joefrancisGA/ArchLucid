import { describe, expect, it } from "vitest";

import {
  FOUNDER_CONSOLE_NOISE_ALLOWLIST,
  FOUNDER_NETWORK_NOISE_ALLOWLIST,
  matchesFounderNoiseAllowlist,
} from "../e2e/helpers/founder-page-noise-allowlist";

describe("founder page noise allowlist (GTM M-104)", () => {
  it("allows known ResizeObserver console noise", () => {
    expect(
      matchesFounderNoiseAllowlist(
        "ResizeObserver loop completed with undelivered notifications.",
        FOUNDER_CONSOLE_NOISE_ALLOWLIST,
      ),
    ).toBe(true);
  });

  it("does not allow arbitrary product errors", () => {
    expect(
      matchesFounderNoiseAllowlist(
        "TypeError: Cannot read properties of null",
        FOUNDER_CONSOLE_NOISE_ALLOWLIST,
      ),
    ).toBe(false);
  });

  it("allows aborted navigation network failures", () => {
    expect(matchesFounderNoiseAllowlist("net::ERR_ABORTED", FOUNDER_NETWORK_NOISE_ALLOWLIST)).toBe(true);
    expect(
      matchesFounderNoiseAllowlist("https://example/favicon.ico", FOUNDER_NETWORK_NOISE_ALLOWLIST),
    ).toBe(true);
  });
});
