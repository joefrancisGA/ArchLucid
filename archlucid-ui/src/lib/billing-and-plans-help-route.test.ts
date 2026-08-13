import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { BILLING_AND_PLANS_HELP_ROUTE_METADATA } from "@/lib/billing-and-plans-help-route-metadata";
import {
  BILLING_AND_PLANS_HELP_PATH,
  SETTINGS_BILLING_PATH,
} from "@/lib/billing-and-plans-help-route";
import { BILLING_HELP_PRIMARY_ACTIONS } from "@/lib/billing-help-guide-content";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";

const HELP_TOPIC_PAGE = join(process.cwd(), "src", "app", "(operator)", "help", "[...topic]", "page.tsx");

const PRODUCT_BILLING_HELP_SURFACES = [
  "archlucid-ui/src/lib/help/help-center-catalog.ts",
  "archlucid-ui/src/lib/usability/page-help-topic-map.ts",
] as const;

describe("billing-and-plans-help-route (HBX)", () => {
  it("marks the specialty guide as noindex with honest metadata", () => {
    expect(BILLING_AND_PLANS_HELP_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
    expect(BILLING_AND_PLANS_HELP_ROUTE_METADATA.title).toBe("Billing and plans");
    expect(BILLING_AND_PLANS_HELP_ROUTE_METADATA.description?.toLowerCase()).toContain("billing");
  });

  it("routes the canonical slug through HelpBillingAndPlansGuideView instead of bare markdown", () => {
    const pageSource = readFileSync(HELP_TOPIC_PAGE, "utf8");

    expect(pageSource).toContain('loaded.entry.slug === "billing-and-plans"');
    expect(pageSource).toContain("HelpBillingAndPlansGuideView");
    expect(pageSource).toContain("BILLING_AND_PLANS_HELP_ROUTE_METADATA");
  });

  it("keeps marketing SEO inventory off the in-app help path", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(BILLING_AND_PLANS_HELP_PATH);
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).not.toContain(BILLING_AND_PLANS_HELP_PATH);
  });

  it("keeps product handoffs on canonical /help/billing-and-plans and /settings/billing", () => {
    const repoRoot = join(process.cwd(), "..");

    expect(BILLING_HELP_PRIMARY_ACTIONS.manageBilling.href).toBe(SETTINGS_BILLING_PATH);

    for (const relativePath of PRODUCT_BILLING_HELP_SURFACES) {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");
      expect(source).toContain("billing-and-plans");
    }
  });
});
