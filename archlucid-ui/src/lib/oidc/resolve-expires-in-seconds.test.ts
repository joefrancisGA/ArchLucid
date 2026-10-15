import { describe, expect, it } from "vitest";

import { resolveExpiresInSeconds } from "@/lib/oidc/resolve-expires-in-seconds";

describe("resolveExpiresInSeconds", () => {
  it("honors zero expires_in", () => {
    expect(resolveExpiresInSeconds(0)).toBe(0);
  });

  it("truncates fractional expires_in to whole seconds", () => {
    expect(resolveExpiresInSeconds(10.9)).toBe(10);
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
});
