import { readFileSync } from "node:fs";

import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { FINDINGS_HELP_ROUTE_METADATA } from "@/lib/findings/findings-help-route-metadata";

import { FINDINGS_HELP_PATH } from "@/lib/findings/findings-help-route";

import { FINDINGS_HELP_RELATED_PRODUCT_DOCS } from "@/lib/findings/findings-help-guide-content";

import { HELP_CENTER_FEATURED_SLUGS } from "@/lib/help/help-center-catalog";

import {

  MARKETING_ROBOTS_DISALLOW_PREFIXES,

  MARKETING_SITEMAP_PATHNAMES,

} from "@/lib/marketing/public-marketing-seo-paths";

const HELP_TOPIC_PAGE = join(process.cwd(), "src", "app", "(operator)", "help", "[...topic]", "page.tsx");

const PRODUCT_FINDINGS_HELP_SURFACES = [

  "archlucid-ui/src/lib/help/help-center-catalog.ts",

  "archlucid-ui/src/lib/findings/findings-help-guide-content.ts",

  "archlucid-ui/src/lib/product-documentation-registry.ts",

] as const;

const CANONICAL_FINDINGS_HELP_HANDOFF_MARKERS = [

  FINDINGS_HELP_PATH,

  "FINDINGS_HELP_PATH",

  "findings",

] as const;

function expectCanonicalFindingsHelpHandoff(source: string): void {

  const hasCanonicalHandoff = CANONICAL_FINDINGS_HELP_HANDOFF_MARKERS.some((marker) =>

    source.includes(marker),

  );

  expect(hasCanonicalHandoff).toBe(true);

}

describe("findings-help-route (HFX)", () => {

  it("marks the specialty guide as noindex with honest metadata", () => {

    expect(FINDINGS_HELP_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });

    expect(FINDINGS_HELP_ROUTE_METADATA.title).toBe("Findings");

    expect(FINDINGS_HELP_ROUTE_METADATA.description?.toLowerCase()).toContain("architecture risks");

  });

  it("routes the canonical slug through HelpFindingsGuideView instead of bare markdown", () => {

    const pageSource = readFileSync(HELP_TOPIC_PAGE, "utf8");

    expect(pageSource).toContain('loaded.entry.slug === "findings"');

    expect(pageSource).toContain("HelpFindingsGuideView");

    expect(pageSource).toContain("FINDINGS_HELP_ROUTE_METADATA");

  });

  it("keeps marketing SEO inventory off the in-app help path", () => {

    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(FINDINGS_HELP_PATH);

    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).not.toContain(FINDINGS_HELP_PATH);

  });

  it("keeps product handoffs on canonical /help/findings", () => {

    const repoRoot = join(process.cwd(), "..");

    for (const relativePath of PRODUCT_FINDINGS_HELP_SURFACES) {

      const source = readFileSync(join(repoRoot, relativePath), "utf8");

      expectCanonicalFindingsHelpHandoff(source);

    }

  });

  it("features findings on the customer Help Center grid and links audit-trail not API contracts", () => {

    expect(HELP_CENTER_FEATURED_SLUGS).toContain("findings");

    expect(FINDINGS_HELP_RELATED_PRODUCT_DOCS.href).toBe("/help/audit-trail");

    expect(FINDINGS_HELP_RELATED_PRODUCT_DOCS.href).not.toContain("governance-api-contracts");

  });

});

