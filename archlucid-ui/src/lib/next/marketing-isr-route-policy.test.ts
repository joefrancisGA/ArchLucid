import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { revalidate } from "./marketing-isr-route-policy";

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "(marketing)");

const tb567MarketingRoutes = ["welcome", "pricing", "trust"] as const;

describe("marketing-isr-route-policy (TB-567)", () => {
  it("uses a five-minute revalidate window", () => {
    expect(revalidate).toBe(300);
  });

  it.each(tb567MarketingRoutes)("route /%s re-exports the shared ISR policy", (routeSegment) => {
    const source = readFileSync(join(appRoot, routeSegment, "page.tsx"), "utf8");

    expect(source).toContain('export { revalidate } from "@/lib/next/marketing-isr-route-policy"');
  });
});
