import { afterEach, describe, expect, it, vi } from "vitest";

import {
  resolveShowcaseApiBase,
  shouldServeShowcaseStaticOnly,
} from "./showcase-page-server-resolution";

describe("shouldServeShowcaseStaticOnly", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("treats capitalized True as enabled after normalization", () => {
    vi.stubEnv("SHOWCASE_STATIC_ONLY", "True");

    expect(shouldServeShowcaseStaticOnly()).toBe(true);
  });

  it("normalizes multiple trailing slashes on the configured preview API base", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_PREVIEW_API_BASE", "https://demo-api.test///");

    expect(resolveShowcaseApiBase()).toBe("https://demo-api.test");
  });
});
