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

  it("collapses vertical-tab control characters in OIDC display copy", () => {
    expect(normalizeOidcDisplayString("Desk\u000BUser")).toBe("Desk User");
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

  it("decodes mistaken percent-encoded plus in JSON error_description", () => {
    expect(readOAuthJsonErrorDescription("Policy%2Bdenied")).toBe("Policy denied");
    expect(readOAuthJsonErrorDescription("Policy%252Bdenied")).toBe("Policy denied");
  });

  it("preserves literal plus in JSON when the description also includes percent-encoded plus", () => {
    expect(readOAuthJsonErrorDescription("User+denied%2Bextra")).toBe("User+denied extra");
  });

  it("still decodes valid percent-escapes when IdPs send them in JSON", () => {
    expect(readOAuthJsonErrorDescription("User%20denied")).toBe("User denied");
  });

  it("decodes doubly percent-encoded spaces in JSON error_description", () => {
    expect(readOAuthJsonErrorDescription("User%2520denied")).toBe("User denied");
  });

  it("decodes triply percent-encoded spaces in JSON error_description", () => {
    expect(readOAuthJsonErrorDescription("User%252520denied")).toBe("User denied");
  });

  it("collapses interior zero-width characters to spaces instead of gluing words", () => {
    expect(readOAuthJsonErrorDescription("Policy\u200bdenied")).toBe("Policy denied");
  });

  it("collapses accidental ZWNJ glue between Latin words in JSON error_description", () => {
    expect(readOAuthJsonErrorDescription("Policy\u200cdenied")).toBe("Policy denied");
  });

  it("collapses accidental ZWJ glue between Latin words in JSON error_description", () => {
    expect(readOAuthJsonErrorDescription("Policy\u200ddenied")).toBe("Policy denied");
  });

  it("decodes percent-encoded newlines in JSON error_description", () => {
    expect(readOAuthJsonErrorDescription("line1%0Aline2")).toBe("line1 line2");
  });

  it("collapses literal CRLF in JSON error_description for single-line token errors", () => {
    expect(readOAuthJsonErrorDescription("line1\r\nline2")).toBe("line1 line2");
  });

  it("returns empty for nbsp-only token-endpoint JSON error_description values", () => {
    expect(readOAuthJsonErrorDescription("\u00a0\u00a0")).toBe("");
  });

  it("returns empty for thin-space-only token-endpoint JSON error_description values", () => {
    expect(readOAuthJsonErrorDescription("\u202f\u202f")).toBe("");
  });

  it("returns empty for figure-space-only token-endpoint JSON error_description values", () => {
    expect(readOAuthJsonErrorDescription("\u2007\u2007")).toBe("");
  });

  it("returns empty for hair-space-only token-endpoint JSON error_description values", () => {
    expect(readOAuthJsonErrorDescription("\u200a\u200a")).toBe("");
  });

  it("returns empty for six-per-em-space-only token-endpoint JSON error_description values", () => {
    expect(readOAuthJsonErrorDescription("\u2006\u2006")).toBe("");
  });

  it("returns empty for em-dash-only token-endpoint JSON error_description values", () => {
    expect(readOAuthJsonErrorDescription("\u2014\u2014")).toBe("");
  });

  it("returns empty for en-dash-only token-endpoint JSON error_description values", () => {
    expect(readOAuthJsonErrorDescription("\u2013\u2013")).toBe("");
  });

  it("returns empty for bullet-only token-endpoint JSON error_description values", () => {
    expect(readOAuthJsonErrorDescription("\u2022\u2022")).toBe("");
  });

  it("returns empty for ellipsis-only token-endpoint JSON error_description values", () => {
    expect(readOAuthJsonErrorDescription("\u2026\u2026")).toBe("");
  });

  it("returns empty for middle-dot-only token-endpoint JSON error_description values", () => {
    expect(readOAuthJsonErrorDescription("\u00b7\u00b7")).toBe("");
  });

  it("returns empty for multiplication-sign-only token-endpoint JSON error_description values", () => {
    expect(readOAuthJsonErrorDescription("\u00d7\u00d7")).toBe("");
  });

  it("returns empty for prime-only token-endpoint JSON error_description values", () => {
    expect(readOAuthJsonErrorDescription("\u2032\u2032")).toBe("");
  });

  it("returns empty for reference-mark-only token-endpoint JSON error_description values", () => {
    expect(readOAuthJsonErrorDescription("\u203b\u203b")).toBe("");
  });

  it("returns empty for dagger-only token-endpoint JSON error_description values", () => {
    expect(readOAuthJsonErrorDescription("\u2020\u2020")).toBe("");
  });

  it("returns empty for double-dagger-only token-endpoint JSON error_description values", () => {
    expect(readOAuthJsonErrorDescription("\u2021\u2021")).toBe("");
  });

  it("returns empty for asterisk-only token-endpoint JSON error_description values", () => {
    expect(readOAuthJsonErrorDescription("**")).toBe("");
  });

  it("returns empty for equals-only token-endpoint JSON error_description values", () => {
    expect(readOAuthJsonErrorDescription("==")).toBe("");
  });

  it("returns empty for hash-only token-endpoint JSON error_description values", () => {
    expect(readOAuthJsonErrorDescription("##")).toBe("");
  });

  it("returns empty for ampersand-only token-endpoint JSON error_description values", () => {
    expect(readOAuthJsonErrorDescription("&&")).toBe("");
  });

  it("returns empty for pipe-only token-endpoint JSON error_description values", () => {
    expect(readOAuthJsonErrorDescription("||")).toBe("");
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

  it("preserves literal plus in token error_description when skin-tone emoji modifiers are present", () => {
    expect(readOAuthJsonErrorDescription("👍🏻+extra")).toBe("👍🏻+extra");
    expect(readOAuthJsonErrorDescription("👋🏽+denied")).toBe("👋🏽+denied");
  });

  it("preserves literal plus in token error_description when emoji ZWJ sequences are present", () => {
    expect(readOAuthJsonErrorDescription("👨\u200d👩\u200d👧+extra")).toBe("👨\u200d👩\u200d👧+extra");
  });

  it("preserves percent-decoded plus in JSON when authorize mixed-plus glue applies", () => {
    expect(readOAuthJsonErrorDescription("👍🏻%2Bextra")).toBe("👍🏻+extra");
    expect(readOAuthJsonErrorDescription("Policy%20denied%2Bextra")).toBe("Policy denied+extra");
    expect(readOAuthJsonErrorDescription("User+denied%2B👍🏻")).toBe("User+denied+👍🏻");
    expect(readOAuthJsonErrorDescription("Policy\u3000denied%252Bextra")).toBe("Policy denied+extra");
    expect(readOAuthJsonErrorDescription("Policy\u2007denied%252Bextra")).toBe("Policy denied+extra");
    expect(readOAuthJsonErrorDescription("Policy\u2008denied%252Bextra")).toBe("Policy denied+extra");
  });

  it("preserves percent-decoded plus in JSON when thin-space glue separates words", () => {
    expect(readOAuthJsonErrorDescription("Policy\u2009denied%252Bextra")).toBe("Policy denied+extra");
  });

  it("preserves percent-decoded plus in JSON when narrow-no-break-space glue separates words", () => {
    expect(readOAuthJsonErrorDescription("Policy\u202fdenied%252Bextra")).toBe("Policy denied+extra");
  });

  it("preserves percent-decoded plus in JSON when hair-space glue separates words", () => {
    expect(readOAuthJsonErrorDescription("Policy\u200adenied%252Bextra")).toBe("Policy denied+extra");
  });

  it("preserves percent-decoded plus in JSON when ZWNJ glue separates words", () => {
    expect(readOAuthJsonErrorDescription("Policy\u200cdenied%252Bextra")).toBe("Policy denied+extra");
  });

  it("preserves percent-decoded plus in JSON when ZWJ glue separates words", () => {
    expect(readOAuthJsonErrorDescription("Policy\u200ddenied%252Bextra")).toBe("Policy denied+extra");
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

  it("decodes percent-encoded plus in authorize error descriptions", () => {
    expect(decodeOAuthErrorDescription("Policy%2Bdenied")).toBe("Policy denied");
    expect(decodeOAuthErrorDescription("Policy%252Bdenied")).toBe("Policy denied");
  });

  it("preserves percent-decoded plus in authorize descriptions when hair-space glue separates words", () => {
    expect(decodeOAuthErrorDescription("Policy\u200adenied%252Bextra")).toBe("Policy denied+extra");
  });

  it("preserves percent-decoded plus in authorize descriptions when figure-space glue separates words", () => {
    expect(decodeOAuthErrorDescription("Policy\u2007denied%252Bextra")).toBe("Policy denied+extra");
  });

  it("preserves percent-decoded plus in authorize descriptions when ZWJ glue separates words", () => {
    expect(decodeOAuthErrorDescription("Policy\u200ddenied%252Bextra")).toBe("Policy denied+extra");
  });

  it("preserves literal plus in authorize error descriptions when form plus was already decoded to space", () => {
    const mixed = new URLSearchParams("error_description=User+denied%2Bextra").get("error_description");

    expect(mixed).toBe("User denied+extra");
    expect(decodeOAuthErrorDescription(mixed)).toBe("User denied+extra");
  });

  it("preserves literal plus in authorize error descriptions when zero-width glue separates words", () => {
    expect(decodeOAuthErrorDescription("User\u200bdenied+extra")).toBe("User denied+extra");
  });

  it("preserves literal plus in authorize error descriptions when ZWNJ glue separates words", () => {
    expect(decodeOAuthErrorDescription("Policy\u200cdenied+extra")).toBe("Policy denied+extra");
    expect(decodeOAuthErrorDescription("Policy\u2007denied%252Bextra")).toBe("Policy denied+extra");
    expect(decodeOAuthErrorDescription("Policy\u2008denied%252Bextra")).toBe("Policy denied+extra");
    expect(decodeOAuthErrorDescription("Policy\u200adenied%252Bextra")).toBe("Policy denied+extra");
    expect(decodeOAuthErrorDescription("Policy\u202fdenied%252Bextra")).toBe("Policy denied+extra");
  });

  it("preserves literal plus in authorize error descriptions when emoji ZWJ sequences are present", () => {
    expect(decodeOAuthErrorDescription("👨\u200d👩\u200d👧+extra")).toBe("👨\u200d👩\u200d👧+extra");
    expect(decodeOAuthErrorDescription("👨\u200d👩\u200d👧%2Bextra")).toBe("👨\u200d👩\u200d👧+extra");
    expect(decodeOAuthErrorDescription("👨\u200d👩\u200d👧%252Bextra")).toBe("👨\u200d👩\u200d👧+extra");
  });

  it("preserves literal plus in authorize error descriptions when regional-indicator flag emoji is present", () => {
    expect(decodeOAuthErrorDescription("🇺🇸+extra")).toBe("🇺🇸+extra");
    expect(decodeOAuthErrorDescription("🇺🇸%2Bextra")).toBe("🇺🇸+extra");
  });

  it("preserves literal plus in authorize error descriptions when skin-tone emoji modifiers are present", () => {
    expect(decodeOAuthErrorDescription("👍🏻+extra")).toBe("👍🏻+extra");
    expect(decodeOAuthErrorDescription("👋🏽+denied")).toBe("👋🏽+denied");
  });

  it("preserves literal plus in authorize error descriptions when skin-tone emoji modifiers are present", () => {
    expect(decodeOAuthErrorDescription("👍🏻+extra")).toBe("👍🏻+extra");
    expect(decodeOAuthErrorDescription("👋🏽+denied")).toBe("👋🏽+denied");
  });

  it("decodes doubly percent-encoded authorize error descriptions", () => {
    expect(decodeOAuthErrorDescription("User%2520denied")).toBe("User denied");
  });

  it("decodes triply percent-encoded authorize error descriptions", () => {
    expect(decodeOAuthErrorDescription("User%252520denied")).toBe("User denied");
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

  it("collapses accidental ZWNJ glue between Latin words in authorize error descriptions", () => {
    expect(decodeOAuthErrorDescription("Policy\u200cdenied")).toBe("Policy denied");
  });

  it("collapses accidental ZWJ glue between Latin words in authorize error descriptions", () => {
    expect(decodeOAuthErrorDescription("Policy\u200ddenied")).toBe("Policy denied");
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

  it("returns empty for thin-space-only percent-encoded error descriptions", () => {
    expect(decodeOAuthErrorDescription("%E2%80%AF")).toBe("");
  });

  it("returns empty for figure-space-only percent-encoded error descriptions", () => {
    expect(decodeOAuthErrorDescription("%E2%80%87")).toBe("");
  });

  it("returns empty for hair-space-only percent-encoded error descriptions", () => {
    expect(decodeOAuthErrorDescription("%E2%80%8A")).toBe("");
  });

  it("returns empty for six-per-em-space-only percent-encoded error descriptions", () => {
    expect(decodeOAuthErrorDescription("%E2%80%86")).toBe("");
  });

  it("returns empty for em-dash-only percent-encoded error descriptions", () => {
    expect(decodeOAuthErrorDescription("%E2%80%94")).toBe("");
  });

  it("returns empty for en-dash-only percent-encoded error descriptions", () => {
    expect(decodeOAuthErrorDescription("%E2%80%93")).toBe("");
  });

  it("returns empty for bullet-only percent-encoded error descriptions", () => {
    expect(decodeOAuthErrorDescription("%E2%80%A2")).toBe("");
  });

  it("returns empty for ellipsis-only percent-encoded error descriptions", () => {
    expect(decodeOAuthErrorDescription("%E2%80%A6")).toBe("");
  });

  it("returns empty for middle-dot-only percent-encoded error descriptions", () => {
    expect(decodeOAuthErrorDescription("%C2%B7")).toBe("");
  });

  it("returns empty for multiplication-sign-only percent-encoded error descriptions", () => {
    expect(decodeOAuthErrorDescription("%C3%97")).toBe("");
  });

  it("returns empty for prime-only percent-encoded error descriptions", () => {
    expect(decodeOAuthErrorDescription("%E2%80%B2")).toBe("");
  });

  it("returns empty for reference-mark-only percent-encoded error descriptions", () => {
    expect(decodeOAuthErrorDescription("%E2%80%BB")).toBe("");
  });

  it("returns empty for dagger-only percent-encoded error descriptions", () => {
    expect(decodeOAuthErrorDescription("%E2%80%A0")).toBe("");
  });

  it("returns empty for double-dagger-only percent-encoded error descriptions", () => {
    expect(decodeOAuthErrorDescription("%E2%80%A1")).toBe("");
  });

  it("returns empty for asterisk-only percent-encoded error descriptions", () => {
    expect(decodeOAuthErrorDescription("%2A%2A")).toBe("");
  });

  it("returns empty for equals-only percent-encoded error descriptions", () => {
    expect(decodeOAuthErrorDescription("%3D%3D")).toBe("");
  });

  it("returns empty for hash-only percent-encoded error descriptions", () => {
    expect(decodeOAuthErrorDescription("%23%23")).toBe("");
  });

  it("returns empty for ampersand-only percent-encoded error descriptions", () => {
    expect(decodeOAuthErrorDescription("%26%26")).toBe("");
  });

  it("returns empty for pipe-only percent-encoded error descriptions", () => {
    expect(decodeOAuthErrorDescription("%7C%7C")).toBe("");
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

  it("maps access_denied when the authorize error query contains trailing control characters", () => {
    expect(humanizeAuthorizeCallbackError("access_denied\u000b", "")).toContain("canceled sign-in");
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

  it("humanizes authorization_pending authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("authorization_pending", "");

    expect(message).toMatch(/authorization pending/i);
    expect(message).not.toContain("authorization_pending");
  });

  it("humanizes slow_down authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("slow_down", "");

    expect(message).toMatch(/slow down/i);
    expect(message).not.toContain("slow_down");
  });

  it("humanizes temporarily_unavailable authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("temporarily_unavailable", "");

    expect(message).toMatch(/temporary error/i);
    expect(message).not.toContain("temporarily_unavailable");
  });

  it("humanizes login_required authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("login_required", "");

    expect(message).toMatch(/sign-in step/i);
    expect(message).not.toContain("login_required");
  });

  it("humanizes interaction_required authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("interaction_required", "");

    expect(message).toMatch(/sign-in step/i);
    expect(message).not.toContain("interaction_required");
  });

  it("humanizes consent_required authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("consent_required", "");

    expect(message).toMatch(/administrator consent/i);
    expect(message).not.toContain("consent_required");
  });

  it("humanizes unauthorized_client authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("unauthorized_client", "");

    expect(message).toMatch(/sign-in route/i);
    expect(message).not.toContain("unauthorized_client");
  });

  it("humanizes invalid_scope authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_scope", "");

    expect(message).toMatch(/permissions/i);
    expect(message).not.toContain("invalid_scope");
  });

  it("humanizes invalid_request authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_request", "");

    expect(message).toMatch(/not valid/i);
    expect(message).not.toContain("invalid_request");
  });

  it("humanizes invalid_client authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_client", "");

    expect(message).toMatch(/invalid client/i);
    expect(message).not.toContain("invalid_client");
  });

  it("humanizes redirect_uri_mismatch authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("redirect_uri_mismatch", "");

    expect(message).toMatch(/redirect uri mismatch/i);
    expect(message).not.toContain("redirect_uri_mismatch");
  });

  it("humanizes invalid_grant authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_grant", "");

    expect(message).toMatch(/invalid grant/i);
    expect(message).not.toContain("invalid_grant");
  });

  it("humanizes unsupported_grant_type authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("unsupported_grant_type", "");

    expect(message).toMatch(/unsupported grant type/i);
    expect(message).not.toContain("unsupported_grant_type");
  });

  it("humanizes invalid_token authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_token", "");

    expect(message).toMatch(/invalid token/i);
    expect(message).not.toContain("invalid_token");
  });

  it("humanizes expired_token authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("expired_token", "");

    expect(message).toMatch(/expired token/i);
    expect(message).not.toContain("expired_token");
  });

  it("humanizes insufficient_scope authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("insufficient_scope", "");

    expect(message).toMatch(/insufficient scope/i);
    expect(message).not.toContain("insufficient_scope");
  });

  it("humanizes account_selection_required authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("account_selection_required", "");

    expect(message).toMatch(/account selection required/i);
    expect(message).not.toContain("account_selection_required");
  });

  it("humanizes registration_not_supported authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("registration_not_supported", "");

    expect(message).toMatch(/registration not supported/i);
    expect(message).not.toContain("registration_not_supported");
  });

  it("humanizes org_internal authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("org_internal", "");

    expect(message).toMatch(/org internal/i);
    expect(message).not.toContain("org_internal");
  });

  it("humanizes admin_consent_required authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("admin_consent_required", "");

    expect(message).toMatch(/admin consent required/i);
    expect(message).not.toContain("admin_consent_required");
  });

  it("humanizes acr_values_not_supported authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("acr_values_not_supported", "");

    expect(message).toMatch(/acr values not supported/i);
    expect(message).not.toContain("acr_values_not_supported");
  });

  it("humanizes invalid_target authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_target", "");

    expect(message).toMatch(/invalid target/i);
    expect(message).not.toContain("invalid_target");
  });

  it("humanizes invalid_request_uri authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_request_uri", "");

    expect(message).toMatch(/invalid request uri/i);
    expect(message).not.toContain("invalid_request_uri");
  });

  it("humanizes invalid_resource authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_resource", "");

    expect(message).toMatch(/invalid resource/i);
    expect(message).not.toContain("invalid_resource");
  });

  it("humanizes invalid_client_metadata authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_client_metadata", "");

    expect(message).toMatch(/invalid client metadata/i);
    expect(message).not.toContain("invalid_client_metadata");
  });

  it("humanizes invalid_session authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_session", "");

    expect(message).toMatch(/invalid session/i);
    expect(message).not.toContain("invalid_session");
  });

  it("humanizes request_not_supported authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("request_not_supported", "");

    expect(message).toMatch(/request not supported/i);
    expect(message).not.toContain("request_not_supported");
  });

  it("humanizes unsupported_response_type authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("unsupported_response_type", "");

    expect(message).toMatch(/unsupported response type/i);
    expect(message).not.toContain("unsupported_response_type");
  });

  it("humanizes request_uri_too_long authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("request_uri_too_long", "");

    expect(message).toMatch(/request uri too long/i);
    expect(message).not.toContain("request_uri_too_long");
  });

  it("humanizes invalid_dpop_proof authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_dpop_proof", "");

    expect(message).toMatch(/invalid dpop proof/i);
    expect(message).not.toContain("invalid_dpop_proof");
  });

  it("humanizes use_second_factor authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("use_second_factor", "");

    expect(message).toMatch(/use second factor/i);
    expect(message).not.toContain("use_second_factor");
  });

  it("humanizes user_cancelled authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("user_cancelled", "");

    expect(message).toMatch(/user cancelled/i);
    expect(message).not.toContain("user_cancelled");
  });

  it("humanizes verification_required authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("verification_required", "");

    expect(message).toMatch(/verification required/i);
    expect(message).not.toContain("verification_required");
  });

  it("humanizes mfa_required authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("mfa_required", "");

    expect(message).toMatch(/mfa required/i);
    expect(message).not.toContain("mfa_required");
  });

  it("humanizes server_error authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("server_error", "");

    expect(message).toMatch(/temporary error/i);
    expect(message).not.toContain("server_error");
  });

  it("humanizes session_expired authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("session_expired", "");

    expect(message).toMatch(/session expired/i);
    expect(message).not.toContain("session_expired");
  });

  it("humanizes login_timeout authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("login_timeout", "");

    expect(message).toMatch(/login timeout/i);
    expect(message).not.toContain("login_timeout");
  });

  it("humanizes device_code_expired authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("device_code_expired", "");

    expect(message).toMatch(/device code expired/i);
    expect(message).not.toContain("device_code_expired");
  });

  it("humanizes invalid_code authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_code", "");

    expect(message).toMatch(/invalid code/i);
    expect(message).not.toContain("invalid_code");
  });

  it("humanizes invalid_credentials authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_credentials", "");

    expect(message).toMatch(/invalid credentials/i);
    expect(message).not.toContain("invalid_credentials");
  });

  it("humanizes invalid_username authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_username", "");

    expect(message).toMatch(/invalid username/i);
    expect(message).not.toContain("invalid_username");
  });

  it("humanizes invalid_password authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_password", "");

    expect(message).toMatch(/invalid password/i);
    expect(message).not.toContain("invalid_password");
  });

  it("humanizes invalid_client_id authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_client_id", "");

    expect(message).toMatch(/invalid client id/i);
    expect(message).not.toContain("invalid_client_id");
  });

  it("humanizes invalid_client_secret authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_client_secret", "");

    expect(message).toMatch(/invalid client secret/i);
    expect(message).not.toContain("invalid_client_secret");
  });

  it("humanizes invalid_grant_challenge authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_grant_challenge", "");

    expect(message).toMatch(/invalid grant challenge/i);
    expect(message).not.toContain("invalid_grant_challenge");
  });

  it("humanizes invalid_resource_owner authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_resource_owner", "");

    expect(message).toMatch(/invalid resource owner/i);
    expect(message).not.toContain("invalid_resource_owner");
  });

  it("humanizes invalid_saml_response authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_saml_response", "");

    expect(message).toMatch(/invalid saml response/i);
    expect(message).not.toContain("invalid_saml_response");
  });


  it("humanizes invalid_saml_assertion authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_saml_assertion", "");

    expect(message).toMatch(/invalid saml assertion/i);
    expect(message).not.toContain("invalid_saml_assertion");
  });

  it("humanizes invalid_oidc_response authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_oidc_response", "");

    expect(message).toMatch(/invalid oidc response/i);
    expect(message).not.toContain("invalid_oidc_response");
  });

  it("humanizes invalid_authentication authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_authentication", "");

    expect(message).toMatch(/invalid authentication/i);
    expect(message).not.toContain("invalid_authentication");
  });

  it("humanizes authentication_required authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("authentication_required", "");

    expect(message).toMatch(/authentication required/i);
    expect(message).not.toContain("authentication_required");
  });

  it("humanizes credentials_required authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("credentials_required", "");

    expect(message).toMatch(/credentials required/i);
    expect(message).not.toContain("credentials_required");
  });

  it("humanizes binding_required authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("binding_required", "");

    expect(message).toMatch(/binding required/i);
    expect(message).not.toContain("binding_required");
  });

  it("humanizes device_authorization_required authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("device_authorization_required", "");

    expect(message).toMatch(/device authorization required/i);
    expect(message).not.toContain("device_authorization_required");
  });

  it("humanizes proof_key_required authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("proof_key_required", "");

    expect(message).toMatch(/proof key required/i);
    expect(message).not.toContain("proof_key_required");
  });

  it("humanizes code_challenge_required authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("code_challenge_required", "");

    expect(message).toMatch(/code challenge required/i);
    expect(message).not.toContain("code_challenge_required");
  });

  it("humanizes pkce_verification_failed authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("pkce_verification_failed", "");

    expect(message).toMatch(/pkce verification failed/i);
    expect(message).not.toContain("pkce_verification_failed");
  });

  it("humanizes invalid_code_verifier authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_code_verifier", "");

    expect(message).toMatch(/invalid code verifier/i);
    expect(message).not.toContain("invalid_code_verifier");
  });

  it("humanizes code_verifier_mismatch authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("code_verifier_mismatch", "");

    expect(message).toMatch(/code verifier mismatch/i);
    expect(message).not.toContain("code_verifier_mismatch");
  });

  it("humanizes state_mismatch authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("state_mismatch", "");

    expect(message).toMatch(/state mismatch/i);
    expect(message).not.toContain("state_mismatch");
  });

  it("humanizes invalid_state authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_state", "");

    expect(message).toMatch(/invalid state/i);
    expect(message).not.toContain("invalid_state");
  });

  it("humanizes invalid_nonce authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_nonce", "");

    expect(message).toMatch(/invalid nonce/i);
    expect(message).not.toContain("invalid_nonce");
  });

  it("humanizes nonce_replay authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("nonce_replay", "");

    expect(message).toMatch(/nonce replay/i);
    expect(message).not.toContain("nonce_replay");
  });

  it("humanizes invalid_session_id authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_session_id", "");

    expect(message).toMatch(/invalid session id/i);
    expect(message).not.toContain("invalid_session_id");
  });

  it("humanizes invalid_saml_issuer authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_saml_issuer", "");

    expect(message).toMatch(/invalid saml issuer/i);
    expect(message).not.toContain("invalid_saml_issuer");

  });

  it("humanizes invalid_saml_nameid authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_saml_nameid", "");

    expect(message).toMatch(/invalid saml nameid/i);
    expect(message).not.toContain("invalid_saml_nameid");
  });

  it("humanizes invalid_saml_nameid authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_saml_nameid", "");

    expect(message).toMatch(/invalid saml nameid/i);
    expect(message).not.toContain("invalid_saml_nameid");
  });

  it("humanizes invalid_saml_subject authorize callback errors with readable copy", () => {
    const message = humanizeAuthorizeCallbackError("invalid_saml_subject", "");

    expect(message).toMatch(/invalid saml subject/i);
    expect(message).not.toContain("invalid_saml_subject");
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

  it("uses canceled-sign-in copy when access_denied error_description is the literal null string", () => {
    const detail = decodeOAuthErrorDescription("null");
    const message = humanizeAuthorizeCallbackError("access_denied", detail);

    expect(detail).toBe("");
    expect(message).toContain("canceled sign-in");
    expect(message).not.toMatch(/:\s*null\b/i);
  });

  it("uses canceled-sign-in copy when access_denied error_description is a broken object coercion string", () => {
    const detail = decodeOAuthErrorDescription("[object Object]");
    const message = humanizeAuthorizeCallbackError("access_denied", detail);

    expect(detail).toBe("");
    expect(message).toContain("canceled sign-in");
    expect(message).not.toContain("[object Object]");
  });

  it("uses canceled-sign-in copy when access_denied error_description is the literal true string", () => {
    const detail = decodeOAuthErrorDescription("true");
    const message = humanizeAuthorizeCallbackError("access_denied", detail);

    expect(detail).toBe("");
    expect(message).toContain("canceled sign-in");
    expect(message).not.toMatch(/:\s*true\b/i);
  });

  it("uses canceled-sign-in copy when access_denied error_description is the literal NaN string", () => {
    const detail = decodeOAuthErrorDescription("NaN");
    const message = humanizeAuthorizeCallbackError("access_denied", detail);

    expect(detail).toBe("");
    expect(message).toContain("canceled sign-in");
    expect(message).not.toMatch(/:\s*NaN\b/i);
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

  it("uses readable default copy for authorization_pending authorize-query errors", () => {
    const message = humanizeAuthorizeCallbackError("authorization_pending", "");

    expect(message).toContain("authorization pending");
    expect(message).toContain("Sign-in did not finish");
  });

  it("uses readable default copy for slow_down authorize-query errors", () => {
    const message = humanizeAuthorizeCallbackError("slow_down", "");

    expect(message).toContain("slow down");
    expect(message).toContain("Sign-in did not finish");
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

  it("uses fixed copy for unauthorized_client authorize-query errors", () => {
    const message = humanizeAuthorizeCallbackError("unauthorized_client", "");

    expect(message).toContain("not enabled");
    expect(message).not.toContain("unauthorized_client");
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

  it("maps authorize error codes with ZWNJ glue to the standard snake_case handlers", () => {
    const message = humanizeAuthorizeCallbackError("access\u200cdenied", "");

    expect(message).toContain("canceled sign-in");
    expect(message).not.toMatch(/accessdenied/i);
  });

  it("maps percent-encoded authorize error codes to the standard snake_case handlers", () => {
    const message = humanizeAuthorizeCallbackError("access%20denied", "");

    expect(message).toContain("canceled sign-in");
    expect(message).not.toMatch(/access%20denied/i);
  });

  it("maps doubly percent-encoded authorize error codes to the standard snake_case handlers", () => {
    const message = humanizeAuthorizeCallbackError("access%2520denied", "");

    expect(message).toContain("canceled sign-in");
    expect(message).not.toMatch(/access%20denied/i);
  });

  it("maps triply percent-encoded authorize error codes to the standard snake_case handlers", () => {
    const message = humanizeAuthorizeCallbackError("access%252520denied", "");

    expect(message).toContain("canceled sign-in");
    expect(message).not.toMatch(/access%2520denied/i);
  });

  it("maps percent-encoded plus signs in authorize error codes to snake_case handlers", () => {
    const message = humanizeAuthorizeCallbackError("invalid%2Bgrant", "");

    expect(message).toContain("invalid grant");
    expect(message).not.toContain("invalid+grant");
  });

  it("maps percent-encoded underscores in authorize error codes to snake_case handlers", () => {
    const message = humanizeAuthorizeCallbackError("unauthorized%5fclient", "");

    expect(message).toContain("not enabled");
    expect(message).not.toMatch(/unauthorized%5fclient/i);
  });

  it("maps doubly percent-encoded underscores in authorize error codes to standard handlers", () => {
    const message = humanizeAuthorizeCallbackError("access%255fdenied", "");

    expect(message).toContain("canceled sign-in");
    expect(message).not.toMatch(/access%5fdenied/i);
  });

  it("maps percent-encoded plus signs in authorize error codes to standard handlers", () => {
    const message = humanizeAuthorizeCallbackError("unauthorized%2Bclient", "");

    expect(message).toContain("not enabled");
    expect(message).not.toMatch(/unauthorized\+client/i);
  });

  it("maps singly percent-encoded underscores in authorize error codes to standard handlers", () => {
    const message = humanizeAuthorizeCallbackError("access%5fdenied", "");

    expect(message).toContain("canceled sign-in");
    expect(message).not.toMatch(/access%5fdenied/i);
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
