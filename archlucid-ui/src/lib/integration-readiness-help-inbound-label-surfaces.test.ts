import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  INTEGRATION_READINESS_HELP_INBOUND_LABEL_SOURCE_FILES,
  INTEGRATION_READINESS_HELP_INBOUND_PATH_LABELS,
} from "@/lib/integration-readiness-help-inbound-label-surfaces";
import { INTEGRATION_READINESS_HELP_TOPIC_LABEL } from "@/lib/integration-readiness-help-evidence-copy";
import {
  INTEGRATION_READINESS_HELP_RELATED_GUIDES,
  integrationReadinessHelpRelatedGuides,
} from "@/lib/integration-readiness-help-related-guides";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

function readInboundLabelSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("integration-readiness help inbound labels and Related density (TB-1696, TB-1700)", () => {
  it("maps integration-readiness help to the canonical topic label", () => {
    for (const [pathname, expectedLabel] of Object.entries(INTEGRATION_READINESS_HELP_INBOUND_PATH_LABELS)) {
      expect(pageHelpTopicForPathname(pathname)?.label).toBe(expectedLabel);
    }

    expect(INTEGRATION_READINESS_HELP_TOPIC_LABEL).toBe("How integration readiness works");
  });

  it("keeps listed inbound surfaces on the canonical integration-readiness help topic label", () => {
    for (const relativePath of INTEGRATION_READINESS_HELP_INBOUND_LABEL_SOURCE_FILES) {
      const source = readInboundLabelSource(relativePath);

      expect(source).toContain("INTEGRATION_READINESS_HELP_TOPIC_LABEL");
    }
  });

  it("limits Related help to at most three connector setup guides", () => {
    const guides = integrationReadinessHelpRelatedGuides();

    expect(guides).toEqual([...INTEGRATION_READINESS_HELP_RELATED_GUIDES]);
    expect(guides.length).toBeLessThanOrEqual(3);
    expect(guides.some((guide) => guide.href.includes("/administration/connection-status"))).toBe(false);
  });
});
