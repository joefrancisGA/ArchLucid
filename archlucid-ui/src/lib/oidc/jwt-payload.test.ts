import { describe, expect, it } from "vitest";

import {
  decodeJwtPayload,
  pickDisplayNameFromPayload,
  readNonceFromPayload,
} from "@/lib/oidc/jwt-payload";

describe("decodeJwtPayload", () => {
  it("decodes a minimal JWT payload", () => {
    const payload = { sub: "u1", name: "Test User" };
    const b64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
    const jwt = `x.${b64}.y`;
    const decoded = decodeJwtPayload(jwt);

    expect(decoded).toEqual(payload);
  });

  it("decodes UTF-8 display names without mojibake", () => {
    const payload = { sub: "u1", name: "Zoë 建築家" };
    const b64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
    const jwt = `x.${b64}.y`;

    expect(decodeJwtPayload(jwt)).toEqual(payload);
  });

  it("returns null for invalid input", () => {
    expect(decodeJwtPayload("not-a-jwt")).toBeNull();
    expect(decodeJwtPayload("")).toBeNull();
  });

  it("reads the second segment when the token has extra dot-separated parts", () => {
    const payload = { sub: "u1", name: "Extra Segment" };
    const b64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
    const jwt = `h.${b64}.sig.extra`;

    expect(decodeJwtPayload(jwt)).toEqual(payload);
  });
});

describe("readNonceFromPayload", () => {
  it("returns nonce when present", () => {
    expect(readNonceFromPayload({ nonce: " n1 ", sub: "x" })).toBe("n1");
  });

  it("returns null when missing", () => {
    expect(readNonceFromPayload({ sub: "x" })).toBeNull();
    expect(readNonceFromPayload(null)).toBeNull();
  });

  it("strips zero-width padding from nonce claims", () => {
    expect(readNonceFromPayload({ nonce: "\u200bn1\u200b", sub: "x" })).toBe("n1");
    expect(readNonceFromPayload({ nonce: "\u200b", sub: "x" })).toBeNull();
  });

  it("collapses interior control characters in nonce claims before PKCE comparison", () => {
    expect(readNonceFromPayload({ nonce: "n1\u000B", sub: "x" })).toBe("n1");
    expect(readNonceFromPayload({ nonce: "\u000C\u000C", sub: "x" })).toBeNull();
  });
});

describe("pickDisplayNameFromPayload", () => {
  it("prefers preferred_username", () => {
    expect(
      pickDisplayNameFromPayload({
        preferred_username: "alice@contoso.com",
        name: "Alice",
      }),
    ).toBe("alice@contoso.com");
  });

  it("falls back to sub", () => {
    expect(pickDisplayNameFromPayload({ sub: "abc-123" })).toBe("abc-123");
  });

  it("strips zero-width padding from display-name claims", () => {
    expect(pickDisplayNameFromPayload({ name: "\u200bJane Operator\u200b" })).toBe("Jane Operator");
    expect(pickDisplayNameFromPayload({ preferred_username: "\u200b" })).toBeNull();
  });

  it("collapses interior zero-width characters in display-name claims instead of gluing words", () => {
    expect(pickDisplayNameFromPayload({ name: "John\u200bDoe" })).toBe("John Doe");
  });

  it("preserves ZWNJ in Persian display names", () => {
    const persianName = "می\u200cخواهم";

    expect(pickDisplayNameFromPayload({ name: persianName })).toBe(persianName);
  });

  it("preserves ZWJ in emoji display names", () => {
    const familyEmoji = "👨\u200d👩\u200d👧";

    expect(pickDisplayNameFromPayload({ name: familyEmoji })).toBe(familyEmoji);
  });
});
