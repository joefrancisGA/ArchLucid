import { afterEach, describe, expect, it, vi } from "vitest";

import { buildUiProcessHealthBody } from "@/lib/ui-process-health";

describe("buildUiProcessHealthBody", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns Healthy with build identity from NEXT_PUBLIC_* fingerprint env", () => {
    vi.stubEnv("NEXT_PUBLIC_BUILD_COMMIT_SHA", "abcdef0123456789abcdef0123456789abcdef01");
    vi.stubEnv("NEXT_PUBLIC_BUILD_TIMESTAMP", "2026-07-16T12:00:00Z");
    vi.stubEnv("NEXT_PUBLIC_DEPLOY_ENV", "staging");

    expect(buildUiProcessHealthBody()).toEqual({
      status: "Healthy",
      commitSha: "abcdef0123456789abcdef0123456789abcdef01",
      buildTimestamp: "2026-07-16T12:00:00Z",
      environment: "staging",
    });
  });

  it("returns unknown placeholders when build fingerprint env is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_BUILD_COMMIT_SHA", "");
    vi.stubEnv("NEXT_PUBLIC_BUILD_TIMESTAMP", "");
    vi.stubEnv("NEXT_PUBLIC_DEPLOY_ENV", "");
    vi.stubEnv("NODE_ENV", "test");

    const body = buildUiProcessHealthBody();

    expect(body.status).toBe("Healthy");
    expect(body.commitSha).toBe("unknown");
    expect(body.buildTimestamp).toBe("unknown");
    expect(body.environment).toBe("test");
  });
});
