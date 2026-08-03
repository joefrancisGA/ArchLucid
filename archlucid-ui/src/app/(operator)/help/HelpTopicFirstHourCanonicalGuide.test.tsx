import { describe, expect, it } from "vitest";

import {
  getProductDocumentationEntry,
  inAppHelpHref,
  normalizeHelpTopicSlug,
} from "@/lib/product-documentation-registry";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

/**
 * TB-1374: first-hour-operator-path is a path-stable alias of Your first architecture review
 * (docs/CORE_PILOT.md). Body rendering is covered by HelpTopicCorePilot.test.tsx.
 */
describe("first-hour-operator-path alias (TB-1374)", () => {
  const aliasSlug = "first-hour-operator-path";
  const canonicalSlug = "first-architecture-review";

  it("normalizes the retired slug to the canonical first-architecture-review entry", () => {
    expect(normalizeHelpTopicSlug(aliasSlug)).toBe(canonicalSlug);

    const entry = getProductDocumentationEntry(aliasSlug);

    expect(entry?.slug).toBe(canonicalSlug);
    expect(entry?.title).toBe("Your first architecture review");
    expect(entry?.sourcePaths).toEqual(["docs/CORE_PILOT.md"]);
  });

  it("emits the canonical in-app help href for bookmarks and search", () => {
    expect(inAppHelpHref(aliasSlug)).toBe(`/help/${canonicalSlug}`);
    expect(inAppHelpHref(canonicalSlug)).toBe(`/help/${canonicalSlug}`);
  });

  it("loads the Core Pilot markdown body through the alias slug", () => {
    const viaAlias = tryLoadProductDocumentation(aliasSlug);
    const viaCanonical = tryLoadProductDocumentation(canonicalSlug);

    expect(viaAlias).not.toBeNull();
    expect(viaCanonical).not.toBeNull();
    expect(viaAlias!.markdown).toBe(viaCanonical!.markdown);
    expect(viaAlias!.markdown).toMatch(/What good looks like/i);
    expect(viaAlias!.markdown).toMatch(/Recommended first session/i);
    expect(viaAlias!.markdown).toMatch(/Run the first review/i);
  });
});
