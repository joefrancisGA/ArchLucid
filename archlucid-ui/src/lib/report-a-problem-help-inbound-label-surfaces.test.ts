import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  REPORT_A_PROBLEM_HELP_INBOUND_LABEL_SOURCE_FILES,
  REPORT_A_PROBLEM_HELP_INBOUND_PATH_LABELS,
} from "@/lib/report-a-problem-help-inbound-label-surfaces";
import { REPORT_A_PROBLEM_HELP_TOPIC_LABEL } from "@/lib/report-a-problem-help-evidence-copy";
import {
  REPORT_A_PROBLEM_HELP_RELATED_GUIDES,
  reportAProblemHelpRelatedGuides,
} from "@/lib/report-a-problem-help-related-guides";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

function readInboundLabelSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("report-a-problem help inbound labels and Related density (TB-1743, TB-1745)", () => {
  it("maps listed inbound paths to the canonical report-a-problem topic label when configured", () => {
    for (const [pathname, expectedLabel] of Object.entries(REPORT_A_PROBLEM_HELP_INBOUND_PATH_LABELS)) {
      expect(pageHelpTopicForPathname(pathname)?.label).toBe(expectedLabel);
    }

    expect(REPORT_A_PROBLEM_HELP_TOPIC_LABEL).toBe("How structured support intake works");
  });

  it("keeps listed inbound surfaces on the canonical report-a-problem topic label", () => {
    for (const relativePath of REPORT_A_PROBLEM_HELP_INBOUND_LABEL_SOURCE_FILES) {
      const source = readInboundLabelSource(relativePath);

      expect(source).toContain("report-a-problem");
    }
  });

  it("limits Related help to at most three buyer-safe guides", () => {
    const guides = reportAProblemHelpRelatedGuides();

    expect(guides).toEqual([...REPORT_A_PROBLEM_HELP_RELATED_GUIDES]);
    expect(guides.length).toBeLessThanOrEqual(3);
    expect(guides.some((guide) => guide.href.includes("/help/security-trust"))).toBe(false);
    expect(guides.some((guide) => guide.href.includes("/help/report-a-problem"))).toBe(false);
  });
});
