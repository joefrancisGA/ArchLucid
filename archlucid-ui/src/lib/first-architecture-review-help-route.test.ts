import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { FIRST_ARCHITECTURE_REVIEW_HELP_ROUTE_METADATA } from "@/lib/first-architecture-review-help-route-metadata";
import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";
import { FIRST_ARCHITECTURE_REVIEW_INBOUND_HANDOFF_SOURCE_FILES } from "@/lib/first-architecture-review-help-inbound-handoff-surfaces";
import { BUYER_FIRST_REVIEW_HELP_HREF } from "@/lib/first-review-90min-playbook-alignment";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";

const HELP_TOPIC_PAGE = join(process.cwd(), "src", "app", "(operator)", "help", "[...topic]", "page.tsx");

const PRODUCT_FIRST_REVIEW_HELP_SURFACES = FIRST_ARCHITECTURE_REVIEW_INBOUND_HANDOFF_SOURCE_FILES.map(
  (relativePath) => `archlucid-ui/${relativePath}` as const,
);

const CANONICAL_FIRST_REVIEW_HELP_HANDOFF_MARKERS = [
  FIRST_ARCHITECTURE_REVIEW_HELP_PATH,
  "FIRST_ARCHITECTURE_REVIEW_HELP_PATH",
  "BUYER_FIRST_REVIEW_HELP_HREF",
  "first-architecture-review",
] as const;

function expectCanonicalFirstReviewHelpHandoff(source: string): void {
  const hasCanonicalHandoff = CANONICAL_FIRST_REVIEW_HELP_HANDOFF_MARKERS.some((marker) =>
    source.includes(marker),
  );

  expect(hasCanonicalHandoff).toBe(true);
}

describe("first-architecture-review-help-route (COR)", () => {
  it("marks the specialty guide as noindex with honest metadata", () => {
    expect(FIRST_ARCHITECTURE_REVIEW_HELP_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
    expect(FIRST_ARCHITECTURE_REVIEW_HELP_ROUTE_METADATA.title).toBe("Your first architecture review");
    expect(FIRST_ARCHITECTURE_REVIEW_HELP_ROUTE_METADATA.description?.toLowerCase()).toContain("guided path");
  });

  it("routes the canonical slug through HelpCorePilotGuideView instead of bare markdown", () => {
    const pageSource = readFileSync(HELP_TOPIC_PAGE, "utf8");

    expect(pageSource).toContain('loaded.entry.slug === "first-architecture-review"');
    expect(pageSource).toContain("HelpCorePilotGuideView");
    expect(pageSource).toContain("FIRST_ARCHITECTURE_REVIEW_HELP_ROUTE_METADATA");
  });

  it("keeps marketing SEO inventory off the in-app help path", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(FIRST_ARCHITECTURE_REVIEW_HELP_PATH);
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).not.toContain(FIRST_ARCHITECTURE_REVIEW_HELP_PATH);
  });

  it("keeps product handoffs on canonical /help/first-architecture-review", () => {
    const repoRoot = join(process.cwd(), "..");

    expect(BUYER_FIRST_REVIEW_HELP_HREF).toBe(FIRST_ARCHITECTURE_REVIEW_HELP_PATH);

    for (const relativePath of PRODUCT_FIRST_REVIEW_HELP_SURFACES) {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");
      expectCanonicalFirstReviewHelpHandoff(source);
      expect(source).not.toContain('href="/help/core-pilot"');
      expect(source).not.toContain("/help/first-hour-operator-path");
      expect(source).not.toContain('helpSlug="core-pilot"');
    }
  });
});
