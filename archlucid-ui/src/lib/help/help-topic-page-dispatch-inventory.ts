import {
  HELP_TOPIC_BARE_MARKDOWN_FALLTHROUGH_ALLOWLIST,
  HELP_TOPIC_ENRICHED_MARKDOWN_DISPATCH_SLUGS,
  HELP_TOPIC_SPECIALTY_GUIDE_DISPATCH_SLUGS,
} from "@/lib/help/help-topic-catch-all-fallthrough";

export type HelpTopicPageDispatchInventoryDiff = {
  readonly missingFromPage: readonly string[];
  readonly missingFromInventory: readonly string[];
};

/**
 * Resolver modules that together own the help topic slug ladder (#163 split).
 * `help-topic-view-resolver` only chains these and owns the terminal TB-1601 assert,
 * so any guard that scans source for slug branches must read every module here.
 */
export const HELP_TOPIC_VIEW_RESOLVER_MODULE_FILENAMES = [
  "help-topic-view-resolver-operate.tsx",
  "help-topic-view-resolver-integrations.tsx",
  "help-topic-view-resolver-admin.tsx",
] as const;

/** Slugs wired in help topic view resolver modules before catch-all fallthrough (TB-2238). */
export function parseHelpTopicViewResolverSlugs(resolverSource: string): ReadonlySet<string> {
  const slugs = new Set<string>();
  const slugPattern = /loaded\.entry\.slug === "([^"]+)"/g;

  for (const match of resolverSource.matchAll(slugPattern)) {
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
