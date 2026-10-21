import { describe, expect, it } from "vitest";

import {
  coerceAcceptedOidcEpochMsHint,
  decodeOAuthErrorDescription,
  humanizeAuthorizeCallbackError,
  normalizeOidcDisplayString,
  parseOidcEpochMsHint,
  readOAuthJsonErrorDescription,
  sanitizeOAuthUserFacingMessage,
} from "@/lib/oidc/oauth-callback-messages";

describe("normalizeOidcDisplayString", () => {
  it("collapses ZWSP-like glue characters to spaces without merging Latin words", () => {
    expect(normalizeOidcDisplayString("John\u200bDoe")).toBe("John Doe");
  });

  it("preserves ZWNJ and ZWJ used in Persian and emoji display copy", () => {
    expect(normalizeOidcDisplayString("می\u200cخواهم")).toBe("می\u200cخواهم");
    expect(normalizeOidcDisplayString("👨\u200d👩\u200d👧")).toBe("👨\u200d👩\u200d👧");
  });
});

describe("readOAuthJsonErrorDescription", () => {
  it("preserves literal percent signs when JSON is not percent-encoded", () => {
    expect(readOAuthJsonErrorDescription("100% failed")).toBe("100% failed");
    expect(readOAuthJsonErrorDescription("a%zz")).toBe("a%zz");
  });

  it("does not treat plus as space in JSON error_description", () => {
    expect(readOAuthJsonErrorDescription("User+denied")).toBe("User+denied");
  });

  it("still decodes valid percent-escapes when IdPs send them in JSON", () => {
    expect(readOAuthJsonErrorDescription("User%20denied")).toBe("User denied");
  });

  it("collapses interior zero-width characters to spaces instead of gluing words", () => {
    expect(readOAuthJsonErrorDescription("Policy\u200bdenied")).toBe("Policy denied");
  });

  it("decodes percent-encoded newlines in JSON error_description", () => {
    expect(readOAuthJsonErrorDescription("line1%0Aline2")).toBe("line1 line2");
  });

  it("preserves ZWNJ in Persian token error_description copy", () => {
    const detail = "دسترسی\u200cرد";

    expect(readOAuthJsonErrorDescription(detail)).toBe(detail);
  });

  it("preserves emoji ZWJ sequences in token error_description copy", () => {
    const detail = "👨\u200d👩\u200d👧";

    expect(readOAuthJsonErrorDescription(detail)).toBe(detail);
  });

  it("preserves regional-indicator flag emoji in token error_description copy", () => {
    const detail = "🇺🇸";

    expect(readOAuthJsonErrorDescription(detail)).toBe(detail);
  });
});

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

  it("preserves literal percent signs in authorize error descriptions when not percent-encoded", () => {
    expect(decodeOAuthErrorDescription("50% off")).toBe("50% off");
    expect(decodeOAuthErrorDescription("a%zz")).toBe("a%zz");
  });

  it("preserves ZWNJ in authorize error descriptions after decode", () => {
    const detail = "دسترسی\u200cرد";

    expect(decodeOAuthErrorDescription(detail)).toBe(detail);
  });

  it("preserves regional-indicator flag emoji in authorize error descriptions", () => {
    expect(decodeOAuthErrorDescription("🇺🇸")).toBe("🇺🇸");
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

  it("returns empty for zero-width-only percent-encoded error descriptions", () => {
    expect(decodeOAuthErrorDescription("%E2%80%8B")).toBe("");
  });

  it("returns empty for underscore-only error descriptions", () => {
    expect(decodeOAuthErrorDescription("___")).toBe("");
  });

  it("returns empty for hyphen-only error descriptions", () => {
    expect(decodeOAuthErrorDescription("---")).toBe("");
  });

  it("returns empty for nbsp-only percent-encoded error descriptions", () => {
    expect(decodeOAuthErrorDescription("%C2%A0")).toBe("");
  });

  it("returns empty for percent-encoded punctuation-only error descriptions", () => {
    expect(decodeOAuthErrorDescription("%2E%2E%2E")).toBe("");
  });

  it("returns empty for percent-encoded underscore-only error descriptions", () => {
    expect(decodeOAuthErrorDescription("%5F%5F%5F")).toBe("");
  });

  it("returns empty for percent-encoded plus-only error descriptions", () => {
    expect(decodeOAuthErrorDescription("%2B%2B")).toBe("");
  });

  it("returns empty for literal plus-only error descriptions", () => {
    expect(decodeOAuthErrorDescription("+++")).toBe("");
  });

  it("returns empty for percent-encoded colon-only error descriptions", () => {
    expect(decodeOAuthErrorDescription("%3A%3A")).toBe("");
  });

  it("returns empty for literal colon-only error descriptions", () => {
    expect(decodeOAuthErrorDescription(":::")).toBe("");
  });

  it("returns empty for percent-encoded slash-only error descriptions", () => {
    expect(decodeOAuthErrorDescription("%2F%2F")).toBe("");
  });
});

describe("humanizeAuthorizeCallbackError", () => {
  it("handles access_denied with and without detail", () => {
    expect(humanizeAuthorizeCallbackError("access_denied", "")).toContain("canceled sign-in");

    expect(humanizeAuthorizeCallbackError("access_denied", "Policy enforced")).toContain("Policy enforced");
  });

  it("maps standard authorize error codes when the error query contains zero-width characters", () => {
    expect(humanizeAuthorizeCallbackError("access\u200b_denied", "")).toContain("canceled sign-in");
  });

  it("maps interaction_required when the error query glues the code with an interior zero-width character", () => {
    expect(humanizeAuthorizeCallbackError("interaction\u200brequired", "")).toContain("Another sign-in step");
  });

  it("maps access_denied when the error query glues the code with a soft hyphen", () => {
    expect(humanizeAuthorizeCallbackError("access\u00ADdenied", "")).toContain("canceled sign-in");
  });

  it("includes emoji ZWJ detail on access_denied authorize callback copy", () => {
    const detail = "👨\u200d👩\u200d👧";

    expect(humanizeAuthorizeCallbackError("access_denied", detail)).toContain(detail);
  });

  it("includes regional-indicator flag detail on access_denied authorize callback copy", () => {
    expect(humanizeAuthorizeCallbackError("access_denied", "🇺🇸")).toBe("Sign-in stopped: 🇺🇸");
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

  it("avoids punctuation-only authorize error codes in default callback copy", () => {
    expect(humanizeAuthorizeCallbackError("...", "")).toContain("complete response");
    expect(humanizeAuthorizeCallbackError("...", "")).not.toContain("...");
    expect(humanizeAuthorizeCallbackError("...", "")).not.toMatch(/Sign-in did not finish \(\.\.\.\)/u);
  });

  it("omits underscore-only authorize error descriptions from callback copy", () => {
    expect(humanizeAuthorizeCallbackError("access_denied", "___")).toContain("canceled sign-in");
    expect(humanizeAuthorizeCallbackError("access_denied", "___")).not.toContain("___");
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

    expect(message.length).toBeLessThanOrEqual(280);
    expect(message.endsWith("…")).toBe(true);
    expect(message.startsWith("Sign-in stopped:")).toBe(true);
  });

  it("truncates buyer-safe authorize copy when the error code is unreadable and description is oversized", () => {
    const oversized = `${"Policy ".repeat(80)}end`;
    const message = humanizeAuthorizeCallbackError("___", oversized);

    expect(message.length).toBeLessThanOrEqual(280);
    expect(message.endsWith("…")).toBe(true);
    expect(message.startsWith("Sign-in did not finish:")).toBe(true);
  });

  it("truncates oversized unknown authorize error codes for callback copy", () => {
    const oversizedCode = "e".repeat(400);
    const message = humanizeAuthorizeCallbackError(oversizedCode, "");

    expect(message.length).toBeLessThanOrEqual(320);
    expect(message.endsWith("…")).toBe(true);
    expect(message).toContain("Sign-in did not finish");
  });

  it("truncates default-branch authorize errors when error code and description are oversized", () => {
    const oversizedCode = "custom_problem";
    const oversized = `${"Policy ".repeat(80)}end`;
    const message = humanizeAuthorizeCallbackError(oversizedCode, oversized);

    expect(message.length).toBeLessThanOrEqual(320);
    expect(message.endsWith("…")).toBe(true);
  });

  it("uses fixed copy for temporarily_unavailable regardless of oversized error_description", () => {
    const oversized = `${"Policy ".repeat(80)}end`;
    const message = humanizeAuthorizeCallbackError("temporarily_unavailable", oversized);

    expect(message).toContain("temporary error");
    expect(message.length).toBeLessThanOrEqual(280);
    expect(message).not.toContain("Policy");
  });

  it("preserves access_denied detail when error_description mixes letters and emoji", () => {
    const message = humanizeAuthorizeCallbackError("access_denied", "Policy 🔒");

    expect(message).toBe("Sign-in stopped: Policy 🔒");
  });

  it("uses canceled-sign-in copy when access_denied error_description is emoji-only", () => {
    const message = humanizeAuthorizeCallbackError("access_denied", "🔒");

    expect(message).toContain("canceled sign-in");
    expect(message).not.toContain("🔒");
  });

  it("omits colon-only authorize error descriptions from access_denied copy", () => {
    const message = humanizeAuthorizeCallbackError("access_denied", ":::");

    expect(message).toContain("canceled sign-in");
    expect(message).not.toContain(":::");
  });

  it("omits plus-only detail on default-branch authorize errors", () => {
    const message = humanizeAuthorizeCallbackError("custom_problem", "+++");

    expect(message).toContain("custom problem");
    expect(message).not.toContain("+++");
  });

  it("omits punctuation-only detail on default-branch authorize errors", () => {
    const message = humanizeAuthorizeCallbackError("custom_problem", "---");

    expect(message).toContain("custom problem");
    expect(message).not.toContain("---");
  });

  it("uses fixed copy for server_error regardless of oversized error_description", () => {
    const oversized = `${"Policy ".repeat(80)}end`;
    const message = humanizeAuthorizeCallbackError("server_error", oversized);

    expect(message).toContain("temporary error");
    expect(message.length).toBeLessThanOrEqual(280);
    expect(message).not.toContain("Policy");
  });

  it("uses fixed copy for login_required regardless of oversized error_description", () => {
    const oversized = `${"Policy ".repeat(80)}end`;
    const message = humanizeAuthorizeCallbackError("login_required", oversized);

    expect(message).toContain("Another sign-in step");
    expect(message.length).toBeLessThanOrEqual(280);
    expect(message).not.toContain("Policy");
  });

  it("uses fixed copy for interaction_required regardless of oversized error_description", () => {
    const oversized = `${"Policy ".repeat(80)}end`;
    const message = humanizeAuthorizeCallbackError("interaction_required", oversized);

    expect(message).toContain("Another sign-in step");
    expect(message.length).toBeLessThanOrEqual(280);
    expect(message).not.toContain("Policy");
  });

  it("omits punctuation-only authorize error descriptions from invalid_request copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_request", "---");

    expect(message).toBe("This sign-in request was not valid. Try signing in again.");
    expect(message).not.toContain("---");
  });

  it("omits colon-only authorize error descriptions from invalid_request copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_request", ":::");

    expect(message).toContain("not valid");
    expect(message).not.toContain(":::");
  });

  it("omits plus-only authorize error descriptions from invalid_request copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_request", "+++");

    expect(message).toBe("This sign-in request was not valid. Try signing in again.");
    expect(message).not.toContain("+++");
  });

  it("uses fixed copy for unauthorized_client regardless of oversized error_description", () => {
    const oversized = `${"Policy ".repeat(80)}end`;
    const message = humanizeAuthorizeCallbackError("unauthorized_client", oversized);

    expect(message).toContain("not enabled");
    expect(message.length).toBeLessThanOrEqual(280);
    expect(message).not.toContain("Policy");
  });

  it("uses fixed copy for invalid_scope regardless of oversized error_description", () => {
    const oversized = `${"Policy ".repeat(80)}end`;
    const message = humanizeAuthorizeCallbackError("invalid_scope", oversized);

    expect(message).toContain("permissions");
    expect(message.length).toBeLessThanOrEqual(280);
    expect(message).not.toContain("Policy");
  });

  it("uses fixed copy for consent_required regardless of oversized error_description", () => {
    const oversized = `${"Policy ".repeat(80)}end`;
    const message = humanizeAuthorizeCallbackError("consent_required", oversized);

    expect(message).toContain("administrator consent");
    expect(message.length).toBeLessThanOrEqual(280);
    expect(message).not.toContain("Policy");
  });

  it("surfaces readable authorize error_description when the error code is punctuation-only", () => {
    expect(humanizeAuthorizeCallbackError("...", "Policy enforced")).toBe("Sign-in did not finish: Policy enforced");
    expect(humanizeAuthorizeCallbackError("...", "Policy enforced")).not.toContain("...");
  });

  it("uses fixed copy for access_denied when error_description is absent", () => {
    const message = humanizeAuthorizeCallbackError("access_denied", "");

    expect(message).toContain("canceled sign-in");
    expect(message.length).toBeLessThanOrEqual(280);
  });

  it("includes numeric invalid_request error_description in callback copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_request", "403");

    expect(message).toBe("This sign-in request was not valid (403). Try signing in again.");
  });

  it("uses invalid_request copy without detail when error_description is whitespace-only", () => {
    const message = humanizeAuthorizeCallbackError(
      "invalid_request",
      decodeOAuthErrorDescription("%20%20%20"),
    );

    expect(message).toBe("This sign-in request was not valid. Try signing in again.");
  });

  it("keeps invalid_request authorize copy bounded when error_description is absent", () => {
    const message = humanizeAuthorizeCallbackError("invalid_request", "");

    expect(message).toBe("This sign-in request was not valid. Try signing in again.");
    expect(message.length).toBeLessThanOrEqual(280);
  });

  it("does not duplicate ellipsis when invalid_request detail was already truncated", () => {
    const oversized = `${"Policy ".repeat(80)}end`;
    const message = humanizeAuthorizeCallbackError("invalid_request", oversized);

    expect((message.match(/…/gu) ?? []).length).toBe(1);
  });

  it("truncates invalid_request authorize errors when error_description is oversized", () => {
    const oversized = `${"Policy ".repeat(80)}end`;
    const message = humanizeAuthorizeCallbackError("invalid_request", oversized);

    expect(message.length).toBeLessThanOrEqual(320);
    expect(message.endsWith("…")).toBe(true);
    expect(message.startsWith("This sign-in request was not valid")).toBe(true);
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

describe("coerceAcceptedOidcEpochMsHint", () => {
  it("truncates fractional epoch-ms JSON numbers to whole milliseconds", () => {
    const truncated = Date.now() + 3_600_000;

    expect(coerceAcceptedOidcEpochMsHint(truncated + 0.75)).toBe(truncated);
    expect(parseOidcEpochMsHint(`${truncated}.25`)).toBe(truncated);
  });
});
