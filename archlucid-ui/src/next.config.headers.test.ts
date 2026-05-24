import { describe, expect, it } from "vitest";

import nextConfig from "../next.config";

describe("next.config headers", () => {
  it("applies immutable cache-control to fingerprinted static assets and images", async () => {
    const headerRules = await nextConfig.headers?.();

    expect(headerRules).toBeDefined();

    const staticRule = headerRules?.find((rule) => rule.source === "/_next/static/:path*");
    const imagesRule = headerRules?.find((rule) => rule.source === "/images/:path*");

    expect(staticRule?.headers).toEqual([
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
    ]);
    expect(imagesRule?.headers).toEqual([
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
    ]);
  });
});
