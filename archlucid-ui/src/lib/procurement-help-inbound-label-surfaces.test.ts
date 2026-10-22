import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  PROCUREMENT_HELP_CANONICAL_HELP_HREF,
  PROCUREMENT_HELP_INBOUND_LABEL_SOURCE_FILES,
  PROCUREMENT_HELP_INBOUND_PATH_LABELS,
} from "@/lib/procurement-help-inbound-label-surfaces";
import { PROCUREMENT_HELP_TOPIC_LABEL } from "@/lib/procurement-help-evidence-copy";
import { PROCUREMENT_HELP_PATH } from "@/lib/procurement-help-guide-content";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

const RETIRED_PRODUCT_OVERVIEW_HELP_ALIAS_HREF = "/help/product-overview";

function readInboundLabelSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("procurement help inbound labels and canonical help href (TB-2273)", () => {
  it("maps the canonical help route to the procurement topic label", () => {
    for (const [pathname, expectedLabel] of Object.entries(PROCUREMENT_HELP_INBOUND_PATH_LABELS)) {
      expect(pageHelpTopicForPathname(pathname)?.label).toBe(expectedLabel);
    }

    expect(PROCUREMENT_HELP_TOPIC_LABEL).toBe("How procurement FAQ works");
    expect(pageHelpTopicForPathname("/help/procurement")?.slug).toBe("procurement");
  });

  it("keeps listed inbound surfaces on canonical procurement handoffs", () => {
    const pageHelpMap = readInboundLabelSource(PROCUREMENT_HELP_INBOUND_LABEL_SOURCE_FILES[0]!);
    const onboardingHub = readInboundLabelSource(PROCUREMENT_HELP_INBOUND_LABEL_SOURCE_FILES[1]!);
    const subprocessorsSources = readInboundLabelSource(PROCUREMENT_HELP_INBOUND_LABEL_SOURCE_FILES[2]!);

    expect(pageHelpMap).toContain("PROCUREMENT_HELP_TOPIC_LABEL");
    expect(onboardingHub).toContain('inAppHelpHref("procurement")');
    expect(subprocessorsSources).toContain('inAppHelpHref("procurement")');
  });

  it("never emits retired help alias hrefs from procurement inbound chrome", () => {
    expect(inAppHelpHref("procurement")).toBe(PROCUREMENT_HELP_CANONICAL_HELP_HREF);
    expect(PROCUREMENT_HELP_PATH).toBe(PROCUREMENT_HELP_CANONICAL_HELP_HREF);

    for (const relativePath of PROCUREMENT_HELP_INBOUND_LABEL_SOURCE_FILES) {
      const source = readInboundLabelSource(relativePath);

      expect(source).not.toContain(RETIRED_PRODUCT_OVERVIEW_HELP_ALIAS_HREF);
      expect(source).not.toContain('inAppHelpHref("product-overview")');
    }
  });
});
