import { afterEach, describe, expect, it } from "vitest";

import {
  formatShortCommitSha,
  readClientDeploymentFingerprint,
} from "@/lib/deployment-fingerprint";

describe("deployment-fingerprint", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_BUILD_COMMIT_SHA;
    delete process.env.NEXT_PUBLIC_BUILD_TIMESTAMP;
    delete process.env.NEXT_PUBLIC_DEPLOY_STAMP;
    delete process.env.NEXT_PUBLIC_DEPLOY_ENV;
    delete process.env.NEXT_PUBLIC_API_UPSTREAM_HOST;
  });

  it("returns unknown for missing build-time values", () => {
    expect(readClientDeploymentFingerprint()).toEqual({
      frontendCommitSha: "unknown",
      buildTimestamp: "unknown",
      deployStamp: "unknown",
      environment: process.env.NODE_ENV?.trim() || "unknown",
      apiUpstreamHost: "unknown",
    });
  });

  it("reads configured NEXT_PUBLIC deployment fingerprint values", () => {
    process.env.NEXT_PUBLIC_BUILD_COMMIT_SHA = "abcdef1234567890abcdef1234567890abcdef12";
    process.env.NEXT_PUBLIC_BUILD_TIMESTAMP = "2026-07-03T12:00:00Z";
    process.env.NEXT_PUBLIC_DEPLOY_STAMP = "1842212345-1";
    process.env.NEXT_PUBLIC_DEPLOY_ENV = "staging";
    process.env.NEXT_PUBLIC_API_UPSTREAM_HOST = "api.example.com";

    expect(readClientDeploymentFingerprint()).toEqual({
      frontendCommitSha: "abcdef1234567890abcdef1234567890abcdef12",
      buildTimestamp: "2026-07-03T12:00:00Z",
      deployStamp: "1842212345-1",
      environment: "staging",
      apiUpstreamHost: "api.example.com",
    });
  });

  it("shortens long commit shas for display", () => {
    expect(formatShortCommitSha("abcdef1234567890abcdef1234567890abcdef12")).toBe("abcdef123456");
    expect(formatShortCommitSha("short")).toBe("short");
  });
});
