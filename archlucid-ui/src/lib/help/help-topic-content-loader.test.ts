import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  HELP_APP_GUIDED_TOPIC_SLUGS,
  HELP_MARKDOWN_WITH_LAYOUT_TOPIC_SLUGS,
  isHelpAppGuidedTopicSlug,
  loadHelpTopicContent,
  resolveHelpTopicContentKind,
} from "@/lib/help/help-topic-content-loader";
import { parseHelpTopicViewResolverSlugs } from "@/lib/help/help-topic-page-dispatch-inventory";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

const HELP_TOPIC_VIEW_RESOLVER_PATH = join(
  process.cwd(),
  "src",
  "lib",
  "help",
  "help-topic-view-resolver.tsx",
);

describe("help-topic-content-loader (TB-2238)", () => {
  it("classifies app-guided troubleshooting without repo markdown", () => {
    const entry = getProductDocumentationEntry("troubleshooting");

    expect(entry).not.toBeNull();
    expect(resolveHelpTopicContentKind(entry!)).toBe("app-guided");

    const loaded = loadHelpTopicContent("troubleshooting");

    expect(loaded).not.toBeNull();
    expect(loaded!.contentKind).toBe("app-guided");
    expect(loaded!.markdown).toBe("");
  });

  it("classifies markdown topics with layout strips", () => {
    const entry = getProductDocumentationEntry("security-trust");

    expect(entry).not.toBeNull();
    expect(resolveHelpTopicContentKind(entry!)).toBe("markdown-with-layout");
    expect(isHelpAppGuidedTopicSlug("security-trust")).toBe(false);
  });

  it("registers every app-guided slug exactly once", () => {
    const unique = new Set(HELP_APP_GUIDED_TOPIC_SLUGS);

    expect(unique.size).toBe(HELP_APP_GUIDED_TOPIC_SLUGS.length);
  });

  it("keeps markdown-with-layout slugs out of app-guided registry", () => {
    for (const slug of HELP_MARKDOWN_WITH_LAYOUT_TOPIC_SLUGS) {
      expect(isHelpAppGuidedTopicSlug(slug)).toBe(false);
    }
  });

  it("aligns app-guided registry with help-topic-view-resolver slug ladder", () => {
    const resolverSource = readFileSync(HELP_TOPIC_VIEW_RESOLVER_PATH, "utf8");
    const resolverSlugs = parseHelpTopicViewResolverSlugs(resolverSource);
    const appGuided = new Set<string>(HELP_APP_GUIDED_TOPIC_SLUGS);
    const markdownWithLayout = new Set<string>(HELP_MARKDOWN_WITH_LAYOUT_TOPIC_SLUGS);
    const expectedResolverSlugs = new Set<string>([...appGuided, ...markdownWithLayout]);
    const missingFromResolver = [...expectedResolverSlugs].filter((slug) => !resolverSlugs.has(slug)).sort();
    const unexpectedResolverSlugs = [...resolverSlugs].filter((slug) => !expectedResolverSlugs.has(slug)).sort();

    expect(missingFromResolver, "app-guided or layout slug missing from resolver").toEqual([]);
    expect(unexpectedResolverSlugs, "resolver slug missing from loader registries").toEqual([]);
  });
});
