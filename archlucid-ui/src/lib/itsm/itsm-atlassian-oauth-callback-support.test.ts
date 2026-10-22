import { describe, expect, it } from "vitest";

import { shouldOfferItsmOAuthSupportMailto } from "@/lib/itsm/itsm-atlassian-oauth-callback-support";

describe("shouldOfferItsmOAuthSupportMailto", () => {
  it("offers mailto only on failure with timestamp and reference id", () => {
    expect(shouldOfferItsmOAuthSupportMailto("failure", "2026-09-15T00:00:00Z", "corr-1")).toBe(
      true,
    );
  });

  it("does not offer mailto on success or loading", () => {
    expect(shouldOfferItsmOAuthSupportMailto("success", "2026-09-15T00:00:00Z", "corr-1")).toBe(
      false,
    );
    expect(shouldOfferItsmOAuthSupportMailto("loading", "2026-09-15T00:00:00Z", "corr-1")).toBe(
      false,
    );
  });

  it("does not offer mailto when correlation metadata is missing", () => {
    expect(shouldOfferItsmOAuthSupportMailto("failure", null, "corr-1")).toBe(false);
    expect(shouldOfferItsmOAuthSupportMailto("failure", "2026-09-15T00:00:00Z", null)).toBe(false);
  });
});
