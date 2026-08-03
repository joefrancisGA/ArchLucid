import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { GOVERNANCE_API_CONTRACTS_HELP_ROUTE_METADATA } from "@/lib/governance-api-contracts-help-route-metadata";
import { GOVERNANCE_API_CONTRACTS_HELP_PATH } from "@/lib/governance-api-contracts-help-route";
import { HELP_CENTER_FEATURED_SLUGS } from "@/lib/help-center-catalog";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";

const HELP_TOPIC_PAGE = join(process.cwd(), "src", "app", "(operator)", "help", "[...topic]", "page.tsx");

const PRODUCT_GOVERNANCE_API_CONTRACTS_SURFACES = [
  "archlucid-ui/src/lib/in-app-doc-href.ts",
  "archlucid-ui/src/lib/product-documentation-content-kinds.ts",
  "archlucid-ui/src/lib/help-center-catalog.ts",
] as const;

const CANONICAL_GOVERNANCE_API_CONTRACTS_HANDOFF_MARKERS = [
  GOVERNANCE_API_CONTRACTS_HELP_PATH,
  "GOVERNANCE_API_CONTRACTS_HELP_PATH",
  "governance-api-contracts",
] as const;

function expectCanonicalGovernanceApiContractsHandoff(source: string): void {
  const hasCanonicalHandoff = CANONICAL_GOVERNANCE_API_CONTRACTS_HANDOFF_MARKERS.some((marker) =>
    source.includes(marker),
  );

  expect(hasCanonicalHandoff).toBe(true);
}

describe("governance-api-contracts-help-route (HG)", () => {
  it("marks the API contracts reference as noindex with honest metadata (TB-1386)", () => {
    expect(GOVERNANCE_API_CONTRACTS_HELP_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
    expect(GOVERNANCE_API_CONTRACTS_HELP_ROUTE_METADATA.title).toBe("API contracts (technical reference)");
    expect(String(GOVERNANCE_API_CONTRACTS_HELP_ROUTE_METADATA.title).toLowerCase()).not.toMatch(
      /^governance/,
    );
    expect(GOVERNANCE_API_CONTRACTS_HELP_ROUTE_METADATA.description?.toLowerCase()).toContain("openapi");
  });

  it("gates internal-runbook topics through HelpTopicAuthorityGate on the help page", () => {
    const pageSource = readFileSync(HELP_TOPIC_PAGE, "utf8");

    expect(pageSource).toContain('entry.contentKind === "internal-runbook"');
    expect(pageSource).toContain("HelpTopicAuthorityGate");
    expect(pageSource).toContain("HelpTopicMarkdownClient");
    expect(pageSource).toContain('return { title: "Help topic not found" };');
  });

  it("keeps marketing SEO inventory off the in-app help path", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(GOVERNANCE_API_CONTRACTS_HELP_PATH);
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).not.toContain(GOVERNANCE_API_CONTRACTS_HELP_PATH);
  });

  it("keeps engineering handoffs on canonical /help/governance-api-contracts", () => {
    const repoRoot = join(process.cwd(), "..");

    for (const relativePath of PRODUCT_GOVERNANCE_API_CONTRACTS_SURFACES) {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");
      expectCanonicalGovernanceApiContractsHandoff(source);
    }
  });

  it("does not expose API contracts on the customer Help Center featured grid", () => {
    expect(HELP_CENTER_FEATURED_SLUGS).not.toContain("governance-api-contracts");
  });
});
