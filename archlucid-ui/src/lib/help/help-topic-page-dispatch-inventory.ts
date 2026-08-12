import {
  HELP_TOPIC_BARE_MARKDOWN_FALLTHROUGH_ALLOWLIST,
  HELP_TOPIC_ENRICHED_MARKDOWN_DISPATCH_SLUGS,
  HELP_TOPIC_SPECIALTY_GUIDE_DISPATCH_SLUGS,
} from "@/lib/help/help-topic-catch-all-fallthrough";

export type HelpTopicPageDispatchInventoryDiff = {
  readonly missingFromPage: readonly string[];
  readonly missingFromInventory: readonly string[];
};

/** Slugs wired in `renderHelpTopicView` before `assertHelpTopicCatchAllFallthroughAllowed` (TB-1603). */
export function parseHelpTopicPageDispatchSlugs(pageSource: string): ReadonlySet<string> {
  const renderStart = pageSource.indexOf("function renderHelpTopicView");

  if (renderStart < 0) {
    throw new Error("help/[...topic]/page.tsx is missing renderHelpTopicView");
  }

  const assertIndex = pageSource.indexOf("assertHelpTopicCatchAllFallthroughAllowed", renderStart);

  if (assertIndex < 0) {
    throw new Error("help/[...topic]/page.tsx is missing assertHelpTopicCatchAllFallthroughAllowed guard");
  }

  const dispatchBody = pageSource.slice(renderStart, assertIndex);
  const slugs = new Set<string>();
  const slugPattern = /loaded\.entry\.slug === "([^"]+)"/g;

  for (const match of dispatchBody.matchAll(slugPattern)) {
    const slug = match[1];

    if (slug !== undefined && slug.length > 0) {
      slugs.add(slug);
    }
  }

  return slugs;
}

/** Committed catch-all dispatch inventory — specialty, enriched markdown, and explicit bare allowlist (TB-1603). */
export function listHelpTopicCatchAllDispatchInventorySlugs(): readonly string[] {
  return [
    ...HELP_TOPIC_SPECIALTY_GUIDE_DISPATCH_SLUGS,
    ...HELP_TOPIC_ENRICHED_MARKDOWN_DISPATCH_SLUGS,
    ...HELP_TOPIC_BARE_MARKDOWN_FALLTHROUGH_ALLOWLIST.map((entry) => entry.slug),
  ];
}

export function diffHelpTopicPageDispatchInventory(
  pageSlugs: ReadonlySet<string>,
  inventorySlugs: readonly string[],
): HelpTopicPageDispatchInventoryDiff {
  const inventory = new Set(inventorySlugs);
  const missingFromPage = [...inventory].filter((slug) => !pageSlugs.has(slug)).sort();
  const missingFromInventory = [...pageSlugs].filter((slug) => !inventory.has(slug)).sort();

  return { missingFromPage, missingFromInventory };
}
