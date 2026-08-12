import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { API_CONTRACTS_HELP_ROUTE_METADATA } from "@/lib/api-contracts-help-route-metadata";
import { API_CONTRACTS_HELP_PATH } from "@/lib/api-contracts-help-route";
import { HELP_CENTER_FEATURED_SLUGS } from "@/lib/help/help-center-catalog";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";
import {
  HELP_TOPIC_PERMANENT_REDIRECTS,
  resolveHelpTopicPermanentRedirect,
} from "@/lib/help/help-topic-permanent-redirects";
import { listProductDocumentationEntries } from "@/lib/product-documentation-registry";

const HELP_TOPIC_PAGE = join(process.cwd(), "src", "app", "(operator)", "help", "[...topic]", "page.tsx");

const PRODUCT_API_CONTRACTS_SURFACES = [
  "archlucid-ui/src/lib/in-app-doc-href.ts",
  "archlucid-ui/src/lib/product-documentation-content-kinds.ts",
  "archlucid-ui/src/lib/help/help-center-catalog.ts",
] as const;

const CANONICAL_API_CONTRACTS_HANDOFF_MARKERS = [
  API_CONTRACTS_HELP_PATH,
  "API_CONTRACTS_HELP_PATH",
  "api-contracts",
] as const;

function expectCanonicalApiContractsHandoff(source: string): void {
  const hasCanonicalHandoff = CANONICAL_API_CONTRACTS_HANDOFF_MARKERS.some((marker) => source.includes(marker));

  expect(hasCanonicalHandoff).toBe(true);
}

describe("api-contracts-help-route (HG)", () => {
  it("marks the API contracts reference as noindex with honest metadata", () => {
    expect(API_CONTRACTS_HELP_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
    expect(API_CONTRACTS_HELP_ROUTE_METADATA.title).toBe("API contracts (technical reference)");
    expect(String(API_CONTRACTS_HELP_ROUTE_METADATA.title).toLowerCase()).not.toMatch(/^governance/);
    expect(API_CONTRACTS_HELP_ROUTE_METADATA.description?.toLowerCase()).toContain("openapi");
  });

  it("gates internal-runbook topics through HelpTopicAuthorityGate on the help page", () => {
    const pageSource = readFileSync(HELP_TOPIC_PAGE, "utf8");

    expect(pageSource).toContain('entry.contentKind === "internal-runbook"');
    expect(pageSource).toContain("HelpTopicAuthorityGate");
    expect(pageSource).toContain("HelpTopicMarkdownClient");
    expect(pageSource).toContain('return { title: "Help topic not found" };');
  });

  it("keeps marketing SEO inventory off the in-app help path", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(API_CONTRACTS_HELP_PATH);
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).not.toContain(API_CONTRACTS_HELP_PATH);
  });

  it("keeps engineering handoffs on canonical /help/api-contracts", () => {
    const repoRoot = join(process.cwd(), "..");

    for (const relativePath of PRODUCT_API_CONTRACTS_SURFACES) {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");
      expectCanonicalApiContractsHandoff(source);
    }
  });

  it("does not expose API contracts on the customer Help Center featured grid", () => {
    expect(HELP_CENTER_FEATURED_SLUGS).not.toContain("api-contracts");
  });

  it("does not register governance-api-contracts as a live canonical slug", () => {
    const liveSlugs = listProductDocumentationEntries().map((entry) => entry.slug);

    expect(liveSlugs).toContain("api-contracts");
    expect(liveSlugs).not.toContain("governance-api-contracts");
  });

  it("matches Python workbook HEP migration for governance-api-contracts bookmark", () => {
    const catalogSource = readFileSync(
      join(process.cwd(), "..", "scripts", "ci", "archlucid_ui_route_catalog.py"),
      "utf8",
    );

    expect(HELP_TOPIC_PERMANENT_REDIRECTS["governance-api-contracts"]).toBe(API_CONTRACTS_HELP_PATH);
    expect(resolveHelpTopicPermanentRedirect("governance-api-contracts")).toBe(API_CONTRACTS_HELP_PATH);
    expect(catalogSource).toContain('"/help/governance-api-contracts": "/help/api-contracts"');
  });
});
