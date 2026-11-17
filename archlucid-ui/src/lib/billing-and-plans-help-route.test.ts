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
import { listPageHelpTopicSlugs } from "@/lib/usability/page-help-topic-rows";

const HELP_TOPIC_PAGE = join(process.cwd(), "src", "app", "(operator)", "help", "[...topic]", "page.tsx");
const HELP_TOPIC_VIEW_RESOLVER_ADMIN = join(
  process.cwd(),
  "src",
  "lib",
  "help",
  "help-topic-view-resolver-admin.tsx",
);

describe("billing-and-plans-help-route (HBX)", () => {
  it("marks the specialty guide as noindex with honest metadata", () => {
    expect(BILLING_AND_PLANS_HELP_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
    expect(BILLING_AND_PLANS_HELP_ROUTE_METADATA.title).toBe("Billing and plans");
    expect(BILLING_AND_PLANS_HELP_ROUTE_METADATA.description?.toLowerCase()).toContain("billing");
  });

  it("routes the canonical slug through HelpBillingAndPlansGuideView instead of bare markdown", () => {
    const pageSource = readFileSync(HELP_TOPIC_PAGE, "utf8");
    const resolverSource = readFileSync(HELP_TOPIC_VIEW_RESOLVER_ADMIN, "utf8");

    expect(resolverSource).toContain('loaded.entry.slug === "billing-and-plans"');
    expect(resolverSource).toContain("HelpBillingAndPlansGuideView");
    expect(pageSource).toContain("BILLING_AND_PLANS_HELP_ROUTE_METADATA");
  });

  it("keeps marketing SEO inventory off the in-app help path", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(BILLING_AND_PLANS_HELP_PATH);
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).not.toContain(BILLING_AND_PLANS_HELP_PATH);
  });

  it("keeps product handoffs on canonical /help/billing-and-plans and /settings/billing", () => {
    expect(BILLING_HELP_PRIMARY_ACTIONS.manageBilling.href).toBe(SETTINGS_BILLING_PATH);
    expect(listPageHelpTopicSlugs()).toContain("billing-and-plans");
  });
});
