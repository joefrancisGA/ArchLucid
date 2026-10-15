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

  it("collapses percent-encoded line breaks to spaces for single-line callback copy", () => {
    expect(decodeOAuthErrorDescription("Policy%20denied%0D%0Ainjected")).toBe("Policy denied injected");
  });

  it("collapses literal line breaks in already-decoded error descriptions", () => {
    expect(decodeOAuthErrorDescription("line1\nline2")).toBe("line1 line2");
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

  it("truncates oversized authorize error descriptions for callback copy", () => {
    const oversized = `${"Policy ".repeat(80)}end`;
    const message = humanizeAuthorizeCallbackError("access_denied", oversized);

    expect(message.length).toBeLessThanOrEqual(320);
    expect(message.endsWith("…")).toBe(true);
    expect(message.startsWith("Sign-in stopped:")).toBe(true);
  });

  it("keeps access_denied detail on one line when the description embeds CRLF", () => {
    const message = humanizeAuthorizeCallbackError(
      "access_denied",
      decodeOAuthErrorDescription("Tenant%20blocked%0D%0Aextra"),
    );

    expect(message).toBe("Sign-in stopped: Tenant blocked extra");
    expect(message).not.toMatch(/\r|\n/u);
  });
});
