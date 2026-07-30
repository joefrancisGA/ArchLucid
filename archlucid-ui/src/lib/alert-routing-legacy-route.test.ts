import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { governanceAlertRulesTabHref } from "@/lib/governance-route-paths";

import nextConfig from "../../next.config";

const LEGACY_ALERT_ROUTING_APP_DIR = join(process.cwd(), "src", "app", "(operator)", "alert-routing");

describe("alert-routing legacy route (TB-1441)", () => {
  it("redirects via next.config only to Alert rules Routing tab", async () => {
    const redirectRules = await nextConfig.redirects?.();
    const rule = redirectRules?.find((entry) => entry.source === "/alert-routing");

    expect(rule?.destination).toBe(governanceAlertRulesTabHref("routing"));
    expect(rule?.permanent).toBe(false);
  });

  it("does not ship an App Router stub page or force-dynamic layout", () => {
    expect(existsSync(join(LEGACY_ALERT_ROUTING_APP_DIR, "page.tsx"))).toBe(false);
    expect(existsSync(join(LEGACY_ALERT_ROUTING_APP_DIR, "layout.tsx"))).toBe(false);
  });
});
