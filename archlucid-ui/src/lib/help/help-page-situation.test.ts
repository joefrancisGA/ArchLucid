import { describe, expect, it } from "vitest";

import {
  HELP_PAGE_SITUATION_TOPIC_IDS,
  helpPageSituationTopicIds,
  type HelpPageSituation,
} from "@/lib/help/help-page-situation";
import { listHelpSearchPanelTopics } from "@/lib/help/help-search-panel-catalog";

describe("help-page-situation", () => {
  it("returns no topics when the page published no situation", () => {
    expect(helpPageSituationTopicIds(null)).toEqual([]);
  });

  it("leads a blocked approval with the blocking-findings topic", () => {
    expect(helpPageSituationTopicIds("review-approval-blocked")[0]).toBe("resolve-blocking-findings");
  });

  it("leads an incomplete evidence chain with the evidence-gap topic", () => {
    expect(helpPageSituationTopicIds("review-evidence-incomplete")[0]).toBe("close-evidence-gaps");
  });

  it("maps every situation topic id to a resolvable catalog topic", () => {
    const knownIds = new Set(listHelpSearchPanelTopics(false).map((topic) => topic.id));
    const situations = Object.keys(HELP_PAGE_SITUATION_TOPIC_IDS) as HelpPageSituation[];

    for (const situation of situations) {
      for (const topicId of HELP_PAGE_SITUATION_TOPIC_IDS[situation]) {
        expect(knownIds.has(topicId), `${situation} -> ${topicId}`).toBe(true);
      }
    }
  });
});
