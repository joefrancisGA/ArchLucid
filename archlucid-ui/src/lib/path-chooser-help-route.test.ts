import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PATH_CHOOSER_HELP_ROUTE_METADATA } from "@/lib/path-chooser-help-route-metadata";
import { PATH_CHOOSER_HELP_PATH } from "@/lib/path-chooser-help-route";
import { HELP_CENTER_FEATURED_SLUGS } from "@/lib/help-center-catalog";
import { findHelpMarkdownTopicRuleSet } from "@/lib/help-markdown-presentation-pipeline";
import {
  HELP_MARKDOWN_TOPIC_RULE_STAGES,
  stripPathChooserContributorLeakage,
} from "@/lib/help-markdown-presentation";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";

const HELP_TOPIC_PAGE = join(process.cwd(), "src", "app", "(operator)", "help", "[...topic]", "page.tsx");
const PRODUCT_PATH_CHOOSER_HELP_SURFACES = [
  "archlucid-ui/src/lib/help-search-panel-catalog.ts",
  "archlucid-ui/src/lib/in-app-doc-href.ts",
  "archlucid-ui/src/app/(operator)/help/HelpDocsClient.tsx",
  "archlucid-ui/src/lib/product-documentation-registry.ts",
] as const;

const CANONICAL_PATH_CHOOSER_HELP_HANDOFF_MARKERS = [
  PATH_CHOOSER_HELP_PATH,
  "PATH_CHOOSER_HELP_PATH",
  "path-chooser",
] as const;

function expectCanonicalPathChooserHelpHandoff(source: string): void {
  const hasCanonicalHandoff = CANONICAL_PATH_CHOOSER_HELP_HANDOFF_MARKERS.some((marker) =>
    source.includes(marker),
  );

  expect(hasCanonicalHandoff).toBe(true);
}

describe("path-chooser-help-route (HPX)", () => {
  it("marks the path chooser as noindex with honest metadata", () => {
    expect(PATH_CHOOSER_HELP_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
    expect(PATH_CHOOSER_HELP_ROUTE_METADATA.title).toBe("Choose your next step");
    expect(PATH_CHOOSER_HELP_ROUTE_METADATA.description?.toLowerCase()).toContain("procurement");
  });

  it("routes the canonical slug through HelpTopicMarkdownView instead of a specialty guide", () => {
    const pageSource = readFileSync(HELP_TOPIC_PAGE, "utf8");

    expect(pageSource).not.toContain('loaded.entry.slug === "path-chooser"');
    expect(pageSource).toContain("HelpTopicMarkdownView");
    expect(pageSource).toContain("PATH_CHOOSER_HELP_ROUTE_METADATA");
  });

  it("sanitizes path-chooser markdown via stripPathChooserContributorLeakage (TB-1712)", () => {
    const ruleSet = findHelpMarkdownTopicRuleSet(HELP_MARKDOWN_TOPIC_RULE_STAGES.audience, {
      helpTopicSlug: "path-chooser",
      normalizedSourcePath: "docs/go-to-market/buyer_orientation_one_screen.md",
    });

    expect(ruleSet?.id).toBe("path-chooser");
    expect(ruleSet?.rules).toContain(stripPathChooserContributorLeakage);
  });

  it("routes contributor leakage out of presented path-chooser copy (TB-1712)", () => {
    const markdown = [
      "> **Start operators here:** internal routing note.",
      "",
      "See `FIRST_PILOT_OPERATOR_PATH.md` for the operator path.",
    ].join("\n");

    const sanitized = stripPathChooserContributorLeakage(markdown);

    expect(sanitized).not.toContain("Start operators here");
    expect(sanitized).not.toContain("FIRST_PILOT_OPERATOR_PATH.md");
    expect(sanitized).toContain("/help/first-architecture-review");
  });

  it("keeps marketing SEO inventory off the in-app help path", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(PATH_CHOOSER_HELP_PATH);
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).not.toContain(PATH_CHOOSER_HELP_PATH);
  });

  it("keeps product handoffs on canonical /help/path-chooser", () => {
    const repoRoot = join(process.cwd(), "..");

    for (const relativePath of PRODUCT_PATH_CHOOSER_HELP_SURFACES) {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");
      expectCanonicalPathChooserHelpHandoff(source);
    }
  });

  it("does not expose path-chooser on the customer Help Center featured grid", () => {
    expect(HELP_CENTER_FEATURED_SLUGS).not.toContain("path-chooser");
  });
});
