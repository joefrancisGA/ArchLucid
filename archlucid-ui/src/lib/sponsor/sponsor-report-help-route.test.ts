import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { SPONSOR_SUMMARY_HELP_ROUTE_METADATA } from "@/lib/sponsor/sponsor-report-help-route-metadata";
import { SPONSOR_SUMMARY_HELP_PATH } from "@/lib/sponsor/sponsor-report-help-route";
import { SPONSOR_SUMMARY_HELP_PRIMARY_ACTIONS } from "@/lib/sponsor/sponsor-report-help-guide-content";
import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";

const HELP_TOPIC_PAGE = join(process.cwd(), "src", "app", "(operator)", "help", "[...topic]", "page.tsx");

const PRODUCT_SPONSOR_SUMMARY_HELP_SURFACES = [
  "archlucid-ui/src/lib/usability/page-help-topic-rows-admin-compose.ts",
  "archlucid-ui/src/lib/usability/page-help-topic-rows-operator-pilot.ts",
  "archlucid-ui/src/lib/help/help-topic-view-resolver-operate.tsx",
] as const;

describe("sponsor-report-help-route (EXE)", () => {
  it("marks the specialty guide as noindex with honest metadata", () => {
    expect(SPONSOR_SUMMARY_HELP_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
    expect(SPONSOR_SUMMARY_HELP_ROUTE_METADATA.title).toBe("Sponsor report");
    expect(SPONSOR_SUMMARY_HELP_ROUTE_METADATA.description?.toLowerCase()).toContain("executive");
  });

  it("routes the canonical slug through HelpSponsorSummaryGuideView instead of bare markdown", () => {
    const pageSource = readFileSync(HELP_TOPIC_PAGE, "utf8");

    expect(pageSource).toContain('entry.slug === "sponsor-report"');
    expect(pageSource).toContain("SPONSOR_SUMMARY_HELP_ROUTE_METADATA");

    const resolverSource = readFileSync(
      join(process.cwd(), "src/lib/help/help-topic-view-resolver-operate.tsx"),
      "utf8",
    );
    expect(resolverSource).toContain('loaded.entry.slug === "sponsor-report"');
    expect(resolverSource).toContain("HelpSponsorSummaryGuideView");
  });

  it("keeps marketing SEO inventory off the in-app help path", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(SPONSOR_SUMMARY_HELP_PATH);
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).not.toContain(SPONSOR_SUMMARY_HELP_PATH);
  });

  it("keeps product handoffs on canonical help and sponsor-report paths", () => {
    const repoRoot = join(process.cwd(), "..");

    expect(SPONSOR_SUMMARY_HELP_PRIMARY_ACTIONS.openSponsorValueReport.href).toBe(
      SPONSOR_REPORT_PATH,
    );

    for (const relativePath of PRODUCT_SPONSOR_SUMMARY_HELP_SURFACES) {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");
      expect(source).toContain("sponsor-report");
    }
  });
});
