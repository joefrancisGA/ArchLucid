import { describe, expect, it } from "vitest";

import { DEMO_MINIMUM_SESSION_SECONDS, decodeJwtExpirySeconds } from "@/lib/jwt-expiry";

function buildJwt(expSeconds: number | null): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify(expSeconds === null ? { sub: "demo" } : { sub: "demo", exp: expSeconds }),
  ).toString("base64url");

  return `${header}.${payload}.sig`;
}

describe("decodeJwtExpirySeconds", () => {
  it("returns null when exp is absent", () => {
    expect(decodeJwtExpirySeconds(buildJwt(null))).toBeNull();
  });

  it("returns exp when present", () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;

    expect(decodeJwtExpirySeconds(buildJwt(exp))).toBe(exp);
  });
});

describe("DEMO_MINIMUM_SESSION_SECONDS", () => {
  it("allows a 30-minute demo with buffer", () => {
    expect(DEMO_MINIMUM_SESSION_SECONDS).toBeGreaterThanOrEqual(30 * 60);
  });
});
