import { afterEach, describe, expect, it, vi } from "vitest";

import { shouldServeShowcaseStaticOnly } from "./showcase-page-server-resolution";

describe("shouldServeShowcaseStaticOnly", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("treats capitalized True as enabled after normalization", () => {
    vi.stubEnv("SHOWCASE_STATIC_ONLY", "True");

    expect(shouldServeShowcaseStaticOnly()).toBe(true);
  });
});
