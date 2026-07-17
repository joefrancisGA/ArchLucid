import { describe, expect, it } from "vitest";

import nextConfig from "../next.config";

describe("next.config headers", () => {
  it("applies no-store shell cache-control and immutable overrides for hashed assets", async () => {
    const headerRules = await nextConfig.headers?.();

    expect(headerRules).toBeDefined();

    const shellRule = headerRules?.find((rule) => rule.source === "/:path*");
    const staticRule = headerRules?.find((rule) => rule.source === "/_next/static/:path*");
    const imagesRule = headerRules?.find((rule) => rule.source === "/images/:path*");

    expect(shellRule?.headers).toEqual([
      { key: "Cache-Control", value: "no-cache, no-store, max-age=0, must-revalidate" },
    ]);
    expect(staticRule?.headers).toEqual([
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
    ]);
    expect(imagesRule?.headers).toEqual([
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
    ]);

    const shellIndex = headerRules?.findIndex((rule) => rule.source === "/:path*") ?? -1;
    const staticIndex = headerRules?.findIndex((rule) => rule.source === "/_next/static/:path*") ?? -1;

    expect(shellIndex).toBeGreaterThanOrEqual(0);
    expect(staticIndex).toBeGreaterThan(shellIndex);
  });
});
