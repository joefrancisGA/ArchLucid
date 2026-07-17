import { describe, expect, it } from "vitest";

import { authorityHostnameMatches } from "@/lib/auth/oidc-authority-host";

describe("authorityHostnameMatches", () => {
  it("matches exact Microsoft issuer hostnames", () => {
    expect(
      authorityHostnameMatches("https://login.microsoftonline.com/tenant/v2.0", [
        "login.microsoftonline.com",
      ]),
    ).toBe(true);
  });

  it("matches exact Google issuer hostnames", () => {
    expect(authorityHostnameMatches("https://accounts.google.com", ["accounts.google.com"])).toBe(
      true,
    );
  });

  it("rejects substring bypass hosts", () => {
    expect(
      authorityHostnameMatches("https://evil.example/login.microsoftonline.com", [
        "login.microsoftonline.com",
      ]),
    ).toBe(false);

    expect(
      authorityHostnameMatches("https://login.microsoftonline.com.evil.example", [
        "login.microsoftonline.com",
      ]),
    ).toBe(false);

    expect(
      authorityHostnameMatches("https://evil.com/?x=accounts.google.com", ["accounts.google.com"]),
    ).toBe(false);
  });

  it("returns false for empty or unparsable authority", () => {
    expect(authorityHostnameMatches("", ["login.microsoftonline.com"])).toBe(false);
    expect(authorityHostnameMatches("not a url", ["login.microsoftonline.com"])).toBe(false);
  });
});
