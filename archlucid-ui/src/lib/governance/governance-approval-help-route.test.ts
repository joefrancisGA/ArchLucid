import { readFileSync } from "node:fs";

import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { GOVERNANCE_APPROVAL_HELP_ROUTE_METADATA } from "@/lib/governance/governance-approval-help-route-metadata";

import { GOVERNANCE_APPROVAL_HELP_PATH } from "@/lib/governance/governance-approval-help-route";

import { GOVERNANCE_APPROVAL_HELP_RELATED_PRODUCT_DOCS } from "@/lib/governance/governance-approval-help-guide-content";

import { HELP_CENTER_FEATURED_SLUGS } from "@/lib/help/help-center-catalog";

import {

  MARKETING_ROBOTS_DISALLOW_PREFIXES,

  MARKETING_SITEMAP_PATHNAMES,

} from "@/lib/marketing/public-marketing-seo-paths";

const HELP_TOPIC_PAGE = join(process.cwd(), "src", "app", "(operator)", "help", "[...topic]", "page.tsx");

const PRODUCT_GOVERNANCE_APPROVAL_HELP_SURFACES = [

  "archlucid-ui/src/lib/help/help-center-catalog.ts",

  "archlucid-ui/src/lib/product-documentation-registry.ts",

  "archlucid-ui/src/lib/help/help-search-panel-catalog.ts",

  "archlucid-ui/src/lib/audit-trail-help-guide-content.ts",

] as const;

const CANONICAL_GOVERNANCE_APPROVAL_HELP_HANDOFF_MARKERS = [

  GOVERNANCE_APPROVAL_HELP_PATH,

  "GOVERNANCE_APPROVAL_HELP_PATH",

  "governance-approval",

] as const;

function expectCanonicalGovernanceApprovalHelpHandoff(source: string): void {

  const hasCanonicalHandoff = CANONICAL_GOVERNANCE_APPROVAL_HELP_HANDOFF_MARKERS.some((marker) =>

    source.includes(marker),

  );

  expect(hasCanonicalHandoff).toBe(true);

}

describe("governance-approval-help-route (GO)", () => {

  it("marks the specialty guide as noindex with honest metadata", () => {

    expect(GOVERNANCE_APPROVAL_HELP_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });

    expect(GOVERNANCE_APPROVAL_HELP_ROUTE_METADATA.title).toBe("Governance approval");

    expect(GOVERNANCE_APPROVAL_HELP_ROUTE_METADATA.description?.toLowerCase()).toContain("submission");

  });

  it("routes the canonical slug through HelpGovernanceApprovalGuideView instead of bare markdown", () => {

    const pageSource = readFileSync(HELP_TOPIC_PAGE, "utf8");

    expect(pageSource).toContain('loaded.entry.slug === "governance-approval"');

    expect(pageSource).toContain("HelpGovernanceApprovalGuideView");

    expect(pageSource).toContain("GOVERNANCE_APPROVAL_HELP_ROUTE_METADATA");

  });

  it("keeps marketing SEO inventory off the in-app help path", () => {

    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(GOVERNANCE_APPROVAL_HELP_PATH);

    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).not.toContain(GOVERNANCE_APPROVAL_HELP_PATH);

  });

  it("keeps product handoffs on canonical /help/governance-approval", () => {

    const repoRoot = join(process.cwd(), "..");

    for (const relativePath of PRODUCT_GOVERNANCE_APPROVAL_HELP_SURFACES) {

      const source = readFileSync(join(repoRoot, relativePath), "utf8");

      expectCanonicalGovernanceApprovalHelpHandoff(source);

    }

  });

  it("features governance approval on the customer Help Center grid and links audit-trail not API contracts", () => {

    expect(HELP_CENTER_FEATURED_SLUGS).toContain("governance-approval");

    expect(GOVERNANCE_APPROVAL_HELP_RELATED_PRODUCT_DOCS.href).toBe("/help/audit-trail");

    expect(GOVERNANCE_APPROVAL_HELP_RELATED_PRODUCT_DOCS.href).not.toContain("governance-api-contracts");

  });

});

