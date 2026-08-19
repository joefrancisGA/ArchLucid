import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  PILOT_GUIDE_HELP_INBOUND_LABEL_SOURCE_FILES,
  PILOT_GUIDE_HELP_INBOUND_PATH_LABELS,
} from "@/lib/pilot-guide-help-inbound-label-surfaces";
import { PILOT_GUIDE_HELP_TOPIC_LABEL } from "@/lib/pilot-guide-help-evidence-copy";
import {
  PILOT_GUIDE_HELP_RELATED_GUIDES,
  pilotGuideHelpRelatedGuides,
} from "@/lib/pilot-guide-help-related-guides";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

function readInboundLabelSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("pilot-guide help inbound labels and Related density (TB-1721, TB-1725)", () => {
  it("maps pilot-guide help to the canonical topic label", () => {
    for (const [pathname, expectedLabel] of Object.entries(PILOT_GUIDE_HELP_INBOUND_PATH_LABELS)) {
      expect(pageHelpTopicForPathname(pathname)?.label).toBe(expectedLabel);
    }

    expect(PILOT_GUIDE_HELP_TOPIC_LABEL).toBe("How the pilot guide works");
  });

  it("keeps listed inbound surfaces on the canonical pilot-guide help topic label", () => {
    for (const relativePath of PILOT_GUIDE_HELP_INBOUND_LABEL_SOURCE_FILES) {
      const source = readInboundLabelSource(relativePath);

      expect(source).toContain("PILOT_GUIDE_HELP_TOPIC_LABEL");
    }
  });

  it("limits Related help to at most three first-review orientation guides", () => {
    const guides = pilotGuideHelpRelatedGuides();

    expect(guides).toEqual([...PILOT_GUIDE_HELP_RELATED_GUIDES]);
    expect(guides.length).toBeLessThanOrEqual(3);
    expect(guides.some((guide) => guide.href.includes("/help/first-hour-operator-path"))).toBe(false);
    expect(guides.some((guide) => guide.href.includes("/help/pilot-guide"))).toBe(false);
  });
});
