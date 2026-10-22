import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  DATA_HANDLING_HELP_INBOUND_LABEL_SOURCE_FILES,
  DATA_HANDLING_HELP_INBOUND_PATH_LABELS,
} from "@/lib/data-handling-help-inbound-label-surfaces";
import { DATA_HANDLING_TENANT_ISOLATION_HELP_TOPIC_LABEL } from "@/lib/data-handling-tenant-isolation-help-evidence-copy";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

function readInboundLabelSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("data-handling help inbound labels (TB-1651)", () => {
  it("maps data-handling help to the canonical topic label", () => {
    for (const [pathname, expectedLabel] of Object.entries(DATA_HANDLING_HELP_INBOUND_PATH_LABELS)) {
      expect(pageHelpTopicForPathname(pathname)?.label).toBe(expectedLabel);
    }

    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_TOPIC_LABEL).toBe("How data handling and tenant isolation work");
  });

  it("keeps listed inbound surfaces on the canonical data-handling help topic label", () => {
    for (const relativePath of DATA_HANDLING_HELP_INBOUND_LABEL_SOURCE_FILES) {
      const source = readInboundLabelSource(relativePath);

      expect(source).toContain("DATA_HANDLING_TENANT_ISOLATION_HELP_TOPIC_LABEL");
    }
  });
});
