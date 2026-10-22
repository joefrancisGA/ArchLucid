import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  COMPARISON_REPLAY_HELP_INBOUND_LABEL_SOURCE_FILES,
  COMPARISON_REPLAY_HELP_INBOUND_PATH_LABELS,
} from "@/lib/comparison-replay-help-inbound-label-surfaces";
import { COMPARISON_REPLAY_HELP_TOPIC_LABEL } from "@/lib/comparison-replay-help-evidence-copy";
import {
  COMPARISON_REPLAY_HELP_RELATED_GUIDES,
  comparisonReplayHelpRelatedGuides,
} from "@/lib/comparison-replay-help-related-guides";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

function readInboundLabelSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("comparison-replay help inbound labels and Related density (TB-1640)", () => {
  it("maps compare and replay workspace routes to the same comparison-replay help label", () => {
    for (const [pathname, expectedLabel] of Object.entries(COMPARISON_REPLAY_HELP_INBOUND_PATH_LABELS)) {
      expect(pageHelpTopicForPathname(pathname)?.label).toBe(expectedLabel);
    }

    expect(COMPARISON_REPLAY_HELP_TOPIC_LABEL).toBe("How to compare and replay reviews");
  });

  it("keeps listed inbound surfaces on the canonical comparison-replay help topic label", () => {
    for (const relativePath of COMPARISON_REPLAY_HELP_INBOUND_LABEL_SOURCE_FILES) {
      const source = readInboundLabelSource(relativePath);

      expect(source).toContain("COMPARISON_REPLAY_HELP_TOPIC_LABEL");
      expect(source).not.toContain("COMPARISON_REPLAY_VALIDATE_HELP_TOPIC_LABEL");
    }
  });

  it("limits Related help to at most three buyer-safe guides without workspace hub duplication", () => {
    const guides = comparisonReplayHelpRelatedGuides();

    expect(guides).toEqual([...COMPARISON_REPLAY_HELP_RELATED_GUIDES]);
    expect(guides.length).toBeLessThanOrEqual(3);
    expect(guides.some((guide) => guide.href.includes("/insights/compare-two-reviews"))).toBe(false);
    expect(guides.some((guide) => guide.href.includes("/internal/validate-route"))).toBe(false);
  });
});
