import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { revalidate } from "./marketing-isr-route-policy";

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "(marketing)");

const tb567MarketingRoutes = ["welcome", "pricing", "trust"] as const;
const tb1484MarketingRoutes = ["compliance-journey"] as const;

describe("marketing-isr-route-policy (TB-567)", () => {
  it("uses a five-minute revalidate window", () => {
    expect(revalidate).toBe(300);
  });

  it.each(tb567MarketingRoutes)("route /%s exports inline ISR revalidate for Next.js segment config", (routeSegment) => {
    const source = readFileSync(join(appRoot, routeSegment, "page.tsx"), "utf8");

    expect(source).toContain("export const revalidate = 300;");
  });
});

describe("marketing-isr-route-policy (TB-1484)", () => {
  it.each(tb1484MarketingRoutes)("route /%s exports inline ISR revalidate for Next.js segment config", (routeSegment) => {
    const source = readFileSync(join(appRoot, routeSegment, "page.tsx"), "utf8");

    expect(source).toContain("export const revalidate = 300;");
    expect(source).toContain('data-testid="compliance-journey-page"');
  });
});
