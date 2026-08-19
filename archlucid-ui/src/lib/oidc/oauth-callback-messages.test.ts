import { describe, expect, it } from "vitest";

import {
  decodeOAuthErrorDescription,
  humanizeAuthorizeCallbackError,
} from "@/lib/oidc/oauth-callback-messages";

describe("decodeOAuthErrorDescription", () => {
  it("returns empty for null-ish", () => {
    expect(decodeOAuthErrorDescription(null)).toBe("");
    expect(decodeOAuthErrorDescription(undefined)).toBe("");
    expect(decodeOAuthErrorDescription("   ")).toBe("");
  });

  it("decodes URI encoding and plus-as-space", () => {
    expect(decodeOAuthErrorDescription("User+canceled")).toBe("User canceled");

    expect(decodeOAuthErrorDescription("Scope%20mismatch")).toBe("Scope mismatch");
  });

  it("falls back safely on invalid percent sequences", () => {
    expect(decodeOAuthErrorDescription("%E0%A4%A")).toBe("%E0%A4%A");
  });
});

describe("humanizeAuthorizeCallbackError", () => {
  it("handles access_denied with and without detail", () => {
    expect(humanizeAuthorizeCallbackError("access_denied", "")).toContain("canceled sign-in");

    expect(humanizeAuthorizeCallbackError("access_denied", "Policy enforced")).toContain("Policy enforced");
  });

  it("maps interaction and consent cases", () => {
    expect(humanizeAuthorizeCallbackError("interaction_required", "")).toContain("Another sign-in step");

    expect(humanizeAuthorizeCallbackError("consent_required", "")).toContain("administrator consent");
  });

  it("uses readable unknown codes", () => {
    expect(humanizeAuthorizeCallbackError("custom_problem", "")).toContain("custom problem");
  });
});
