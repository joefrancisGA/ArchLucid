import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  diffHelpTopicPageDispatchInventory,
  listHelpTopicCatchAllDispatchInventorySlugs,
  parseHelpTopicViewResolverSlugs,
} from "@/lib/help/help-topic-page-dispatch-inventory";

const HELP_TOPIC_VIEW_RESOLVER_PATHS = [
  "help-topic-view-resolver.tsx",
  "help-topic-view-resolver-operate.tsx",
  "help-topic-view-resolver-integrations.tsx",
  "help-topic-view-resolver-admin.tsx",
].map((fileName) => join(process.cwd(), "src", "lib", "help", fileName));

describe("help-topic-page-dispatch-inventory TB-1603 / TB-2238", () => {
  it("keeps resolveHelpTopicView slug ladder aligned with committed dispatch inventory", () => {
    const resolverSource = HELP_TOPIC_VIEW_RESOLVER_PATHS.map((path) => readFileSync(path, "utf8")).join(
      "\n",
    );
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
