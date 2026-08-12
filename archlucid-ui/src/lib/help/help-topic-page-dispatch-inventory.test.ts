import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  diffHelpTopicPageDispatchInventory,
  listHelpTopicCatchAllDispatchInventorySlugs,
  parseHelpTopicPageDispatchSlugs,
} from "@/lib/help/help-topic-page-dispatch-inventory";

const HELP_TOPIC_PAGE_PATH = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "help",
  "[...topic]",
  "page.tsx",
);

describe("help-topic-page-dispatch-inventory TB-1603", () => {
  it("keeps renderHelpTopicView slug ladder aligned with committed dispatch inventory", () => {
    const pageSource = readFileSync(HELP_TOPIC_PAGE_PATH, "utf8");
    const pageSlugs = parseHelpTopicPageDispatchSlugs(pageSource);
    const inventorySlugs = listHelpTopicCatchAllDispatchInventorySlugs();
    const diff = diffHelpTopicPageDispatchInventory(pageSlugs, inventorySlugs);

    expect(diff.missingFromPage, "inventory slug missing from page.tsx if-ladder").toEqual([]);
    expect(diff.missingFromInventory, "page.tsx dispatch missing from inventory registry").toEqual([]);
  });
});
