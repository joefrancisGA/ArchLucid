import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  SPONSOR_REPORT_HELP_INBOUND_LABEL_SOURCE_FILES,
  SPONSOR_REPORT_HELP_INBOUND_PATH_LABELS,
} from "@/lib/sponsor-report-help-inbound-label-surfaces";
import { SPONSOR_REPORT_HELP_TOPIC_LABEL } from "@/lib/sponsor/sponsor-report-help-evidence-copy";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

function readInboundLabelSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("sponsor-report help inbound labels (TB-1686, TB-1690)", () => {
  it("maps sponsor report workspace routes to the same sponsor-report help label", () => {
    for (const [pathname, expectedLabel] of Object.entries(SPONSOR_REPORT_HELP_INBOUND_PATH_LABELS)) {
      expect(pageHelpTopicForPathname(pathname)?.label).toBe(expectedLabel);
    }

    expect(SPONSOR_REPORT_HELP_TOPIC_LABEL).toBe("How the sponsor report works");
  });

  it("keeps listed inbound surfaces on the canonical sponsor-report help topic label", () => {
    for (const relativePath of SPONSOR_REPORT_HELP_INBOUND_LABEL_SOURCE_FILES) {
      const source = readInboundLabelSource(relativePath);

      expect(source).toContain("SPONSOR_REPORT_HELP_TOPIC_LABEL");
    }
  });
});
