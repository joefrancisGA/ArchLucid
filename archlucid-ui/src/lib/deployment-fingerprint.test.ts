import { afterEach, describe, expect, it } from "vitest";

import {
  formatCiBuildNumberLabel,
  formatDeploymentBuildFingerprintLine,
  formatShortCommitSha,
  isKnownFingerprintValue,
  readClientDeploymentFingerprint,
} from "@/lib/deployment-fingerprint";

describe("deployment-fingerprint", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_BUILD_COMMIT_SHA;
    delete process.env.NEXT_PUBLIC_BUILD_TIMESTAMP;
    delete process.env.NEXT_PUBLIC_DEPLOY_STAMP;
    delete process.env.NEXT_PUBLIC_CI_BUILD_NUMBER;
    delete process.env.NEXT_PUBLIC_DEPLOY_ENV;
    delete process.env.NEXT_PUBLIC_API_UPSTREAM_HOST;
  });

  it("returns unknown for missing build-time values", () => {
    expect(readClientDeploymentFingerprint()).toEqual({
      frontendCommitSha: "unknown",
      buildTimestamp: "unknown",
      deployStamp: "unknown",
      ciBuildNumber: "unknown",
      environment: process.env.NODE_ENV?.trim() || "unknown",
      apiUpstreamHost: "unknown",
    });
  });

  it("reads configured NEXT_PUBLIC deployment fingerprint values", () => {
    process.env.NEXT_PUBLIC_BUILD_COMMIT_SHA = "abcdef1234567890abcdef1234567890abcdef12";
    process.env.NEXT_PUBLIC_BUILD_TIMESTAMP = "2026-07-03T12:00:00Z";
    process.env.NEXT_PUBLIC_DEPLOY_STAMP = "1842212345-1";
    process.env.NEXT_PUBLIC_CI_BUILD_NUMBER = "1842";
    process.env.NEXT_PUBLIC_DEPLOY_ENV = "staging";
    process.env.NEXT_PUBLIC_API_UPSTREAM_HOST = "api.example.com";

    expect(readClientDeploymentFingerprint()).toEqual({
      frontendCommitSha: "abcdef1234567890abcdef1234567890abcdef12",
      buildTimestamp: "2026-07-03T12:00:00Z",
      deployStamp: "1842212345-1",
      ciBuildNumber: "1842",
      environment: "staging",
      apiUpstreamHost: "api.example.com",
    });
  });

  it("shortens long commit shas for display", () => {
    expect(formatShortCommitSha("abcdef1234567890abcdef1234567890abcdef12")).toBe("abcdef123456");
    expect(formatShortCommitSha("short")).toBe("short");
  });

  it("treats empty and unknown sentinels as missing fingerprint values", () => {
    expect(isKnownFingerprintValue("")).toBe(false);
    expect(isKnownFingerprintValue("unknown")).toBe(false);
    expect(isKnownFingerprintValue("  unknown  ")).toBe(false);
    expect(isKnownFingerprintValue("1842")).toBe(true);
  });

  it("formats a discrete CI build label only when the number is known", () => {
    expect(formatCiBuildNumberLabel("unknown")).toBeNull();
    expect(formatCiBuildNumberLabel("")).toBeNull();
    expect(formatCiBuildNumberLabel("1842")).toBe("Build 1842");
  });

  it("prefixes the footer line with the CI build number when baked in", () => {
    expect(
      formatDeploymentBuildFingerprintLine({
        frontendCommitSha: "abcdef1234567890abcdef1234567890abcdef12",
        buildTimestamp: "2026-07-03T12:00:00Z",
        deployStamp: "1842212345-1",
        ciBuildNumber: "1842",
        environment: "staging",
        apiUpstreamHost: "api.example.com",
      }),
    ).toBe("Build 1842 · UI build abcdef123456 · 2026-07-03T12:00:00Z · env staging · API api.example.com");
  });

  it("omits the CI build prefix when the number was not baked in", () => {
    expect(
      formatDeploymentBuildFingerprintLine({
        frontendCommitSha: "abcdef1234567890abcdef1234567890abcdef12",
        buildTimestamp: "2026-07-03T12:00:00Z",
        deployStamp: "unknown",
        ciBuildNumber: "unknown",
        environment: "staging",
        apiUpstreamHost: "api.example.com",
      }),
    ).toBe("UI build abcdef123456 · 2026-07-03T12:00:00Z · env staging · API api.example.com");
  });
});
