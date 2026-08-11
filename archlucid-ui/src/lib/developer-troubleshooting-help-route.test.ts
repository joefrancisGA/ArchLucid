import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DEVELOPER_TROUBLESHOOTING_HELP_ROUTE_METADATA } from "@/lib/developer-troubleshooting-help-route-metadata";
import {
  DEVELOPER_TROUBLESHOOTING_HELP_PATH,
  ENGINEERING_TROUBLESHOOTING_HELP_PATH,
} from "@/lib/developer-troubleshooting-help-route";
import { HELP_CENTER_FEATURED_SLUGS } from "@/lib/help-center-catalog";
import { resolveHelpTopicPermanentRedirect } from "@/lib/help-topic-permanent-redirects";
import {
  getProductDocumentationEntry,
  inAppHelpHref,
} from "@/lib/product-documentation-registry";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";
import { ENGINEERING_TROUBLESHOOTING_HELP_PAGE_TITLE } from "@/lib/engineering-troubleshooting-help-guide-content";

const HELP_TOPIC_PAGE = join(process.cwd(), "src", "app", "(operator)", "help", "[...topic]", "page.tsx");

const PRODUCT_ENGINEERING_TROUBLESHOOTING_SURFACES = [
  "archlucid-ui/src/lib/in-app-doc-href.ts",
  "archlucid-ui/src/lib/help-search-panel-catalog.ts",
  "archlucid-ui/src/lib/product-documentation-content-kinds.ts",
  "archlucid-ui/src/lib/help-center-catalog.ts",
] as const;

const CANONICAL_ENGINEERING_TROUBLESHOOTING_HANDOFF_MARKERS = [
  ENGINEERING_TROUBLESHOOTING_HELP_PATH,
  "ENGINEERING_TROUBLESHOOTING_HELP_PATH",
  "engineering-troubleshooting",
] as const;

function expectCanonicalEngineeringTroubleshootingHandoff(source: string): void {
  const hasCanonicalHandoff = CANONICAL_ENGINEERING_TROUBLESHOOTING_HANDOFF_MARKERS.some((marker) =>
    source.includes(marker),
  );

  expect(hasCanonicalHandoff).toBe(true);
}

describe("engineering-troubleshooting-help-route (HDX / TB-1248)", () => {
  it("marks the engineering runbook as noindex with honest metadata", () => {
    expect(DEVELOPER_TROUBLESHOOTING_HELP_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
    expect(DEVELOPER_TROUBLESHOOTING_HELP_ROUTE_METADATA.title).toBe(ENGINEERING_TROUBLESHOOTING_HELP_PAGE_TITLE);
    expect(DEVELOPER_TROUBLESHOOTING_HELP_ROUTE_METADATA.description?.toLowerCase()).toContain("cli");
  });

  it("TB-1248: canonicalizes slug and redirects legacy developer-troubleshooting bookmarks", () => {
    expect(ENGINEERING_TROUBLESHOOTING_HELP_PATH).toBe("/help/engineering-troubleshooting");
    expect(DEVELOPER_TROUBLESHOOTING_HELP_PATH).toBe(ENGINEERING_TROUBLESHOOTING_HELP_PATH);
    expect(getProductDocumentationEntry("engineering-troubleshooting")?.title).toBe(
      ENGINEERING_TROUBLESHOOTING_HELP_PAGE_TITLE,
    );
    expect(getProductDocumentationEntry("developer-troubleshooting")).toBeNull();
    expect(resolveHelpTopicPermanentRedirect("developer-troubleshooting")).toBe(
      ENGINEERING_TROUBLESHOOTING_HELP_PATH,
    );
    expect(resolveHelpTopicPermanentRedirect("engineering-troubleshooting")).toBeNull();
    expect(inAppHelpHref("developer-troubleshooting")).toBe(ENGINEERING_TROUBLESHOOTING_HELP_PATH);
    expect(inAppHelpHref("engineering-troubleshooting")).toBe(ENGINEERING_TROUBLESHOOTING_HELP_PATH);
  });

  it("gates internal-runbook topics through HelpTopicAuthorityGate on the help page", () => {
    const pageSource = readFileSync(HELP_TOPIC_PAGE, "utf8");

    expect(pageSource).toContain('entry.contentKind === "internal-runbook"');
    expect(pageSource).toContain("HelpTopicAuthorityGate");
    expect(pageSource).toContain("HelpTopicMarkdownClient");
    expect(pageSource).toContain("HelpEngineeringTroubleshootingGuideView");
    expect(pageSource).toContain('loaded.entry.slug === "engineering-troubleshooting"');
    expect(pageSource).toContain("resolveInternalRunbookHelpRouteMetadata");
  });

  it("keeps marketing SEO inventory off the in-app help path", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(ENGINEERING_TROUBLESHOOTING_HELP_PATH);
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).not.toContain(ENGINEERING_TROUBLESHOOTING_HELP_PATH);
  });

  it("keeps engineering runbook handoffs on canonical /help/engineering-troubleshooting", () => {
    const repoRoot = join(process.cwd(), "..");

    for (const relativePath of PRODUCT_ENGINEERING_TROUBLESHOOTING_SURFACES) {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");
      expectCanonicalEngineeringTroubleshootingHandoff(source);
    }
  });

  it("does not expose the engineering runbook on the customer Help Center featured grid", () => {
    expect(HELP_CENTER_FEATURED_SLUGS).not.toContain("engineering-troubleshooting");
    expect(HELP_CENTER_FEATURED_SLUGS).not.toContain("developer-troubleshooting");
  });
});
