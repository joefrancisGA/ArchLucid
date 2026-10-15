import { describe, expect, it } from "vitest";

import {
  decodeOAuthErrorDescription,
  humanizeAuthorizeCallbackError,
  sanitizeOAuthUserFacingMessage,
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

  it("collapses percent-encoded tab characters in error descriptions", () => {
    expect(decodeOAuthErrorDescription("Policy%09denied")).toBe("Policy denied");
  });

  it("collapses percent-encoded C0 control characters in error descriptions", () => {
    expect(decodeOAuthErrorDescription("Policy%08denied")).toBe("Policy denied");
  });

  it("collapses soft hyphens in authorize error descriptions for readable single-line copy", () => {
    expect(decodeOAuthErrorDescription("Policy%C2%ADdenied")).toBe("Policy denied");
    expect(decodeOAuthErrorDescription("%C2%AD")).toBe("");
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

  it("avoids empty parentheses when the authorize error code is whitespace-only", () => {
    expect(humanizeAuthorizeCallbackError("   ", "")).toContain("complete response");
    expect(humanizeAuthorizeCallbackError("   ", "")).not.toMatch(/\(\s*\)/u);
  });

  it("still surfaces authorize error_description when the error code is whitespace-only", () => {
    expect(humanizeAuthorizeCallbackError("   ", "Policy enforced")).toBe("Sign-in did not finish: Policy enforced");
  });

  it("avoids empty parentheses when the authorize error code is underscore-only", () => {
    expect(humanizeAuthorizeCallbackError("___", "")).toContain("complete response");
    expect(humanizeAuthorizeCallbackError("___", "")).not.toMatch(/\(\s*\)/u);
  });

  it("treats zero-width authorize error codes as missing codes", () => {
    expect(humanizeAuthorizeCallbackError("\u200b", "")).toContain("complete response");
    expect(humanizeAuthorizeCallbackError("\u200b", "")).not.toMatch(/\(/u);
  });

  it("treats word-joiner-only authorize error codes as missing codes", () => {
    expect(humanizeAuthorizeCallbackError("\u2060", "")).toContain("complete response");
    expect(humanizeAuthorizeCallbackError("\u2060", "")).not.toMatch(/\(/u);
  });

  it("does not truncate OAuth user-facing copy on a lone UTF-16 surrogate", () => {
    const emoji = "\uD83D\uDE00";
    const oversized = `${"x".repeat(278)}${emoji}tail`;
    const sanitized = sanitizeOAuthUserFacingMessage(oversized);
    const withoutEllipsis = sanitized.endsWith("…") ? sanitized.slice(0, -1) : sanitized;

    expect(sanitized.endsWith("…")).toBe(true);
    expect(withoutEllipsis.isWellFormed()).toBe(true);
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
