import { describe, expect, it } from "vitest";

import { resolveExpiresInSeconds } from "@/lib/oidc/resolve-expires-in-seconds";

describe("resolveExpiresInSeconds", () => {
  it("honors zero expires_in", () => {
    expect(resolveExpiresInSeconds(0)).toBe(0);
  });

  it("truncates fractional expires_in to whole seconds", () => {
    expect(resolveExpiresInSeconds(10.9)).toBe(10);
  });

  it("honors sub-second fractional expires_in as zero seconds", () => {
    expect(resolveExpiresInSeconds(0.9)).toBe(0);
  });

  it("maps negative expires_in to the default lifetime", () => {
    expect(resolveExpiresInSeconds(-30)).toBe(3600);
  });

  it("maps a null provider expires_in to the default lifetime", () => {
    expect(resolveExpiresInSeconds(null as unknown as number)).toBe(3600);
  });

  it("maps a whitespace-only string expires_in to the default lifetime", () => {
    expect(resolveExpiresInSeconds("   " as unknown as number)).toBe(3600);
  });

  it("parses a numeric string expires_in after trimming", () => {
    expect(resolveExpiresInSeconds("  7200  " as unknown as number)).toBe(7200);
  });

  it("parses a numeric string expires_in after stripping zero-width characters", () => {
    expect(resolveExpiresInSeconds("7200\u200b" as unknown as number)).toBe(7200);
  });

  it("parses a numeric string expires_in with a leading plus sign", () => {
    expect(resolveExpiresInSeconds("+3600" as unknown as number)).toBe(3600);
  });

  it("maps an unsafe-integer expires_in to the default lifetime", () => {
    const unsafeInteger = Number.MAX_SAFE_INTEGER + 1;

    expect(resolveExpiresInSeconds(unsafeInteger)).toBe(3600);
  });

  it("maps a comma-grouped string expires_in to the default lifetime", () => {
    expect(resolveExpiresInSeconds("3,600" as unknown as number)).toBe(3600);
  });

  it("maps an implausibly large safe-integer expires_in to the default lifetime", () => {
    expect(resolveExpiresInSeconds(Number.MAX_SAFE_INTEGER)).toBe(3600);
  });

  it("honors expires_in values up to one year", () => {
    expect(resolveExpiresInSeconds(31_536_000)).toBe(31_536_000);
  });

  it("parses a numeric string expires_in in scientific notation", () => {
    expect(resolveExpiresInSeconds("3.6e3" as unknown as number)).toBe(3600);
  });

  it("parses a binary-prefixed string expires_in when Number accepts the literal", () => {
    expect(resolveExpiresInSeconds("0b101" as unknown as number)).toBe(5);
  });

  it("parses a string expires_in with leading zeros", () => {
    expect(resolveExpiresInSeconds("0003600" as unknown as number)).toBe(3600);
  });
});
