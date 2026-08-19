import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  diffHelpTopicPageDispatchInventory,
  listHelpTopicCatchAllDispatchInventorySlugs,
  parseHelpTopicViewResolverSlugs,
} from "@/lib/help/help-topic-page-dispatch-inventory";

const HELP_TOPIC_VIEW_RESOLVER_PATH = join(
  process.cwd(),
  "src",
  "lib",
  "help",
  "help-topic-view-resolver.tsx",
);

describe("help-topic-page-dispatch-inventory TB-1603 / TB-2238", () => {
  it("keeps resolveHelpTopicView slug ladder aligned with committed dispatch inventory", () => {
    const resolverSource = readFileSync(HELP_TOPIC_VIEW_RESOLVER_PATH, "utf8");
    const resolverSlugs = parseHelpTopicViewResolverSlugs(resolverSource);
    const inventorySlugs = listHelpTopicCatchAllDispatchInventorySlugs();
    const diff = diffHelpTopicPageDispatchInventory(resolverSlugs, inventorySlugs);

    expect(diff.missingFromPage, "inventory slug missing from help-topic-view-resolver.tsx if-ladder").toEqual([]);
    expect(
      diff.missingFromInventory,
      "help-topic-view-resolver.tsx dispatch missing from inventory registry",
    ).toEqual([]);
  });
});
