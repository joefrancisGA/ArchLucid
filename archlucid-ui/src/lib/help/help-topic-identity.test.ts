import { describe, expect, it } from "vitest";

import {
  isAllowedPageHelpTopicSlug,
  isMapOnlyHelpTopicSlug,
  MAP_ONLY_HELP_TOPIC_SLUGS,
} from "@/lib/help/help-topic-identity";

describe("help-topic-identity", () => {
  it("treats review-artifacts as the documented map-only orphan", () => {
    expect(MAP_ONLY_HELP_TOPIC_SLUGS).toEqual(["review-artifacts"]);
    expect(isMapOnlyHelpTopicSlug("review-artifacts")).toBe(true);
    expect(isMapOnlyHelpTopicSlug(" Review-Artifacts ")).toBe(true);
    expect(isMapOnlyHelpTopicSlug("findings")).toBe(false);
  });

  it("allows registry slugs and the map-only orphan", () => {
    const registrySlugs = new Set(["findings", "getting-started"]);

    expect(isAllowedPageHelpTopicSlug("findings", registrySlugs)).toBe(true);
    expect(isAllowedPageHelpTopicSlug("review-artifacts", registrySlugs)).toBe(true);
    expect(isAllowedPageHelpTopicSlug("unknown-topic", registrySlugs)).toBe(false);
    expect(isAllowedPageHelpTopicSlug("  ", registrySlugs)).toBe(false);
  });
});
