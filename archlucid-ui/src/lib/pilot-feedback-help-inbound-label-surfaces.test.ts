import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  PILOT_FEEDBACK_HELP_INBOUND_LABEL_SOURCE_FILES,
  PILOT_FEEDBACK_HELP_INBOUND_PATH_LABELS,
} from "@/lib/pilot-feedback-help-inbound-label-surfaces";
import { PILOT_FEEDBACK_HELP_TOPIC_LABEL } from "@/lib/pilot-feedback-help-evidence-copy";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

function readInboundLabelSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("pilot-feedback help inbound labels (TB-1716, TB-1718)", () => {
  it("maps pilot-feedback help routes to the canonical topic label", () => {
    for (const [pathname, expectedLabel] of Object.entries(PILOT_FEEDBACK_HELP_INBOUND_PATH_LABELS)) {
      expect(pageHelpTopicForPathname(pathname)?.label).toBe(expectedLabel);
    }

    expect(PILOT_FEEDBACK_HELP_TOPIC_LABEL).toBe("How pilot feedback works");
  });

  it("keeps listed inbound surfaces on the canonical pilot-feedback help topic label", () => {
    for (const relativePath of PILOT_FEEDBACK_HELP_INBOUND_LABEL_SOURCE_FILES) {
      const source = readInboundLabelSource(relativePath);

      expect(source).toContain("PILOT_FEEDBACK_HELP_TOPIC_LABEL");
    }
  });
});
