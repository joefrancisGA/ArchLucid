import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CANONICAL_FIRST_REVIEW_HELP_DISCOVERY_SLUG,
  FIRST_ARCHITECTURE_REVIEW_DISCOVERY_SOURCE_FILES,
  RETIRED_FIRST_REVIEW_HELP_DISCOVERY_SLUGS,
  isRetiredFirstReviewHelpDiscoverySlug,
} from "@/lib/first-architecture-review-help-discovery-surfaces";
import { FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE } from "@/lib/first-architecture-review-help-copy";
import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";
import {
  HELP_CENTER_FEATURED_SLUGS,
  listHelpCenterTopics,
} from "@/lib/help/help-center-catalog";
import {
  listDuplicateHelpSearchPanelTopicTitles,
  listHelpSearchPanelTopics,
} from "@/lib/help/help-search-panel-catalog";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

function readDiscoverySource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function collectHelpSearchFirstReviewGuideTopics() {
  return listHelpSearchPanelTopics(false).filter((topic) => topic.id === "first-review-guide");
}

describe("first-architecture-review help discovery (TB-1377)", () => {
  it("features exactly one canonical first-review guide on the help landing grid", () => {
    expect(HELP_CENTER_FEATURED_SLUGS).toContain(CANONICAL_FIRST_REVIEW_HELP_DISCOVERY_SLUG);
    expect(HELP_CENTER_FEATURED_SLUGS).not.toContain("review-guide");

    for (const slug of RETIRED_FIRST_REVIEW_HELP_DISCOVERY_SLUGS) {
      expect(HELP_CENTER_FEATURED_SLUGS).not.toContain(slug);
    }
  });

  it("does not register retired first-review slugs as peer help-center catalog entries", () => {
    const defaultTopics = listHelpCenterTopics({ showAdvanced: false, isAdmin: false });
    const slugs = defaultTopics.map((entry) => entry.slug);

    expect(slugs).toContain(CANONICAL_FIRST_REVIEW_HELP_DISCOVERY_SLUG);

    for (const slug of RETIRED_FIRST_REVIEW_HELP_DISCOVERY_SLUGS) {
      expect(slugs).not.toContain(slug);
      expect(getProductDocumentationEntry(slug)).toBeNull();
    }
  });

  it("routes help-search first-review-guide to the canonical help path without twin keywords", () => {
    const topics = collectHelpSearchFirstReviewGuideTopics();

    expect(topics).toHaveLength(1);
    expect(topics[0]?.title).toBe(FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE);
    expect(topics[0]?.action).toEqual({
      kind: "route",
      href: FIRST_ARCHITECTURE_REVIEW_HELP_PATH,
      helpSlug: CANONICAL_FIRST_REVIEW_HELP_DISCOVERY_SLUG,
    });

    const keywordCorpus = topics[0]?.keywords.join(" ").toLowerCase() ?? "";

    expect(keywordCorpus).not.toContain("first-hour");
    expect(keywordCorpus).not.toContain("core pilot");
  });

  it("keeps listed discovery surfaces free of retired first-review help slugs", () => {
    for (const relativePath of FIRST_ARCHITECTURE_REVIEW_DISCOVERY_SOURCE_FILES) {
      const source = readDiscoverySource(relativePath);

      for (const slug of RETIRED_FIRST_REVIEW_HELP_DISCOVERY_SLUGS) {
        expect(source, `${relativePath}:${slug}`).not.toContain(`helpSlug="${slug}"`);
        expect(source, `${relativePath}:${slug}`).not.toContain(`"/help/${slug}"`);
      }

      expect(source, relativePath).toContain(CANONICAL_FIRST_REVIEW_HELP_DISCOVERY_SLUG);
    }
  });

  it("does not present duplicate first-review guide titles in the help search catalog", () => {
    expect(listDuplicateHelpSearchPanelTopicTitles(false)).not.toContain(
      FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE.toLowerCase(),
    );
  });

  it("classifies retired discovery slugs consistently", () => {
    for (const slug of RETIRED_FIRST_REVIEW_HELP_DISCOVERY_SLUGS) {
      expect(isRetiredFirstReviewHelpDiscoverySlug(slug)).toBe(true);
    }

    expect(isRetiredFirstReviewHelpDiscoverySlug(CANONICAL_FIRST_REVIEW_HELP_DISCOVERY_SLUG)).toBe(false);
  });
});
