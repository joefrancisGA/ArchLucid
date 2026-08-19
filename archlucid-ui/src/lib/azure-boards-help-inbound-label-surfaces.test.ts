import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  AZURE_BOARDS_HELP_CANONICAL_HELP_HREF,
  AZURE_BOARDS_HELP_INBOUND_LABEL_SOURCE_FILES,
  AZURE_BOARDS_HELP_INBOUND_PATH_LABELS,
} from "@/lib/azure-boards-help-inbound-label-surfaces";
import { AZURE_BOARDS_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/azure-boards-integration-evidence-copy";
import { AZURE_BOARDS_HELP_TOPIC_HREF } from "@/lib/azure-boards-page-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

const RETIRED_AZURE_BOARDS_HELP_ALIAS_HREF = "/help/integrations/azure-boards";

function readInboundLabelSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("azure-boards help inbound labels and canonical help href (TB-1759)", () => {
  it("maps Azure Boards product and help routes to the canonical topic label", () => {
    for (const [pathname, expectedLabel] of Object.entries(AZURE_BOARDS_HELP_INBOUND_PATH_LABELS)) {
      expect(pageHelpTopicForPathname(pathname)?.label).toBe(expectedLabel);
    }

    expect(AZURE_BOARDS_INTEGRATION_HELP_TOPIC_LABEL).toBe("How Azure Boards integration works");
    expect(pageHelpTopicForPathname("/integrations/azure-boards")?.slug).toBe("azure-boards");
  });

  it("keeps listed inbound surfaces on the canonical azure-boards help topic label", () => {
    const pageHelpMap = readInboundLabelSource(AZURE_BOARDS_HELP_INBOUND_LABEL_SOURCE_FILES[0]!);
    const pageCopy = readInboundLabelSource(AZURE_BOARDS_HELP_INBOUND_LABEL_SOURCE_FILES[1]!);
    const aside = readInboundLabelSource(AZURE_BOARDS_HELP_INBOUND_LABEL_SOURCE_FILES[2]!);

    expect(pageHelpMap).toContain("AZURE_BOARDS_INTEGRATION_HELP_TOPIC_LABEL");
    expect(pageCopy).toContain("AZURE_BOARDS_HELP_TOPIC_HREF");
    expect(aside).toContain("AZURE_BOARDS_HELP_TOPIC_HREF");
  });

  it("never emits retired help alias hrefs from Azure Boards product chrome", () => {
    expect(inAppHelpHref("azure-boards")).toBe(AZURE_BOARDS_HELP_CANONICAL_HELP_HREF);
    expect(AZURE_BOARDS_HELP_TOPIC_HREF).toBe(AZURE_BOARDS_HELP_CANONICAL_HELP_HREF);

    for (const relativePath of AZURE_BOARDS_HELP_INBOUND_LABEL_SOURCE_FILES) {
      const source = readInboundLabelSource(relativePath);

      expect(source).not.toContain(RETIRED_AZURE_BOARDS_HELP_ALIAS_HREF);
      expect(source).not.toContain('inAppHelpHref("integrations/azure-boards")');
    }
  });
});
