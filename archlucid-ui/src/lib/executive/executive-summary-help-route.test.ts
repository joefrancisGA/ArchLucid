import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { EXECUTIVE_SUMMARY_HELP_ROUTE_METADATA } from "@/lib/executive/executive-summary-help-route-metadata";
import { EXECUTIVE_SUMMARY_HELP_PATH } from "@/lib/executive/executive-summary-help-route";
import { EXECUTIVE_SUMMARY_HELP_PRIMARY_ACTIONS } from "@/lib/executive/executive-summary-help-guide-content";
import { SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH } from "@/lib/sponsor-report-navigation";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";

const HELP_TOPIC_PAGE = join(process.cwd(), "src", "app", "(operator)", "help", "[...topic]", "page.tsx");

const PRODUCT_EXECUTIVE_SUMMARY_HELP_SURFACES = [
  "archlucid-ui/src/lib/help/help-center-catalog.ts",
  "archlucid-ui/src/lib/usability/page-help-topic-map.ts",
] as const;

describe("executive-summary-help-route (EXE)", () => {
  it("marks the specialty guide as noindex with honest metadata", () => {
    expect(EXECUTIVE_SUMMARY_HELP_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
    expect(EXECUTIVE_SUMMARY_HELP_ROUTE_METADATA.title).toBe("Executive summary");
    expect(EXECUTIVE_SUMMARY_HELP_ROUTE_METADATA.description?.toLowerCase()).toContain("sponsor");
  });

  it("routes the canonical slug through HelpExecutiveSummaryGuideView instead of bare markdown", () => {
    const pageSource = readFileSync(HELP_TOPIC_PAGE, "utf8");

    expect(pageSource).toContain('loaded.entry.slug === "executive-summary"');
    expect(pageSource).toContain("HelpExecutiveSummaryGuideView");
    expect(pageSource).toContain("EXECUTIVE_SUMMARY_HELP_ROUTE_METADATA");
  });

  it("keeps marketing SEO inventory off the in-app help path", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(EXECUTIVE_SUMMARY_HELP_PATH);
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).not.toContain(EXECUTIVE_SUMMARY_HELP_PATH);
  });

  it("keeps product handoffs on canonical help and sponsor-report paths", () => {
    const repoRoot = join(process.cwd(), "..");

    expect(EXECUTIVE_SUMMARY_HELP_PRIMARY_ACTIONS.openExecutiveValueReport.href).toBe(
      SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
    );

    for (const relativePath of PRODUCT_EXECUTIVE_SUMMARY_HELP_SURFACES) {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");
      expect(source).toContain("executive-summary");
    }
  });
});
