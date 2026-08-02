import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DEVELOPER_TROUBLESHOOTING_HELP_ROUTE_METADATA } from "@/lib/developer-troubleshooting-help-route-metadata";
import { DEVELOPER_TROUBLESHOOTING_HELP_PATH } from "@/lib/developer-troubleshooting-help-route";
import { HELP_CENTER_FEATURED_SLUGS } from "@/lib/help-center-catalog";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";

const HELP_TOPIC_PAGE = join(process.cwd(), "src", "app", "(operator)", "help", "[...topic]", "page.tsx");

const PRODUCT_DEVELOPER_TROUBLESHOOTING_SURFACES = [
  "archlucid-ui/src/lib/in-app-doc-href.ts",
  "archlucid-ui/src/lib/help-search-panel-catalog.ts",
  "archlucid-ui/src/lib/product-documentation-content-kinds.ts",
  "archlucid-ui/src/lib/help-center-catalog.ts",
] as const;

const CANONICAL_DEVELOPER_TROUBLESHOOTING_HANDOFF_MARKERS = [
  DEVELOPER_TROUBLESHOOTING_HELP_PATH,
  "DEVELOPER_TROUBLESHOOTING_HELP_PATH",
  "developer-troubleshooting",
] as const;

function expectCanonicalDeveloperTroubleshootingHandoff(source: string): void {
  const hasCanonicalHandoff = CANONICAL_DEVELOPER_TROUBLESHOOTING_HANDOFF_MARKERS.some((marker) =>
    source.includes(marker),
  );

  expect(hasCanonicalHandoff).toBe(true);
}

describe("developer-troubleshooting-help-route (HDX)", () => {
  it("marks the engineering runbook as noindex with honest metadata", () => {
    expect(DEVELOPER_TROUBLESHOOTING_HELP_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
    expect(DEVELOPER_TROUBLESHOOTING_HELP_ROUTE_METADATA.title).toBe("Engineering troubleshooting runbook");
    expect(DEVELOPER_TROUBLESHOOTING_HELP_ROUTE_METADATA.description?.toLowerCase()).toContain("cli");
  });

  it("gates internal-runbook topics through HelpTopicAuthorityGate on the help page", () => {
    const pageSource = readFileSync(HELP_TOPIC_PAGE, "utf8");

    expect(pageSource).toContain('entry.contentKind === "internal-runbook"');
    expect(pageSource).toContain("HelpTopicAuthorityGate");
    expect(pageSource).toContain("HelpTopicMarkdownClient");
    expect(pageSource).toContain('return { title: "Help topic not found" };');
  });

  it("keeps marketing SEO inventory off the in-app help path", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(DEVELOPER_TROUBLESHOOTING_HELP_PATH);
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).not.toContain(DEVELOPER_TROUBLESHOOTING_HELP_PATH);
  });

  it("keeps engineering runbook handoffs on canonical /help/developer-troubleshooting", () => {
    const repoRoot = join(process.cwd(), "..");

    for (const relativePath of PRODUCT_DEVELOPER_TROUBLESHOOTING_SURFACES) {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");
      expectCanonicalDeveloperTroubleshootingHandoff(source);
    }
  });

  it("does not expose the engineering runbook on the customer Help Center featured grid", () => {
    expect(HELP_CENTER_FEATURED_SLUGS).not.toContain("developer-troubleshooting");
  });
});
