import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { resolveHelpTopicPermanentRedirect } from "@/lib/help-topic-permanent-redirects";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  RETIRED_CREATING_RUNS_HELP_ALIAS_TRAFFIC_PATH,
} from "@/lib/ui-route-traffic-retired-help-topic-aliases";
import { REVIEW_GUIDE_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-review-guide-help";

const HELP_CATCH_ALL_PAGE_PATH = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "help",
  "[...topic]",
  "page.tsx",
);

const BUYER_HELP_SURFACES = [
  "src/app/(operator)/help/_sections/HelpReviewGuideView.tsx",
  "src/lib/empty-state-presets.ts",
  "src/lib/usability/page-help-topic-map.ts",
  "src/lib/bulk-evidence-upload-copy.ts",
  "src/lib/architecture-created-clarifications-sources.ts",
] as const;

const BANNED_CREATING_RUNS_BUYER_COPY = [
  RETIRED_CREATING_RUNS_HELP_ALIAS_TRAFFIC_PATH,
  "creating runs",
  "Creating runs",
] as const;

describe("creating-runs help alias honesty (TB-1642)", () => {
  it("permanently redirects retired bookmarks before help topic render", () => {
    expect(resolveHelpTopicPermanentRedirect("creating-runs")).toBe(REVIEW_GUIDE_HELP_TRAFFIC_PATH);
    expect(inAppHelpHref("creating-runs")).toBe(REVIEW_GUIDE_HELP_TRAFFIC_PATH);

    const pageSource = readFileSync(HELP_CATCH_ALL_PAGE_PATH, "utf8");
    const permanentRedirectIndex = pageSource.indexOf("resolveHelpTopicPermanentRedirect");
    const entryLookupIndex = pageSource.indexOf("getProductDocumentationEntry(slug)");

    expect(permanentRedirectIndex).toBeGreaterThanOrEqual(0);
    expect(entryLookupIndex).toBeGreaterThan(permanentRedirectIndex);
    expect(pageSource).toContain("permanentRedirect(permanentRedirectTarget)");
  });

  it.each(BUYER_HELP_SURFACES)(
    "keeps %s free of buyer-visible creating-runs path or copy",
    (relativePath) => {
      const source = readFileSync(join(process.cwd(), relativePath), "utf8");

      for (const banned of BANNED_CREATING_RUNS_BUYER_COPY) {
        expect(source, `${relativePath} must not contain "${banned}"`).not.toContain(banned);
      }
    },
  );
});
