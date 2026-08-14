import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  ENGINEERING_TROUBLESHOOTING_HELP_CANONICAL_HELP_HREF,
  ENGINEERING_TROUBLESHOOTING_HELP_INBOUND_LABEL_SOURCE_FILES,
  ENGINEERING_TROUBLESHOOTING_HELP_INBOUND_PATH_LABELS,
} from "@/lib/engineering-troubleshooting-help-inbound-label-surfaces";
import { ENGINEERING_TROUBLESHOOTING_HELP_TOPIC_LABEL } from "@/lib/engineering-troubleshooting-help-guide-content";
import { ENGINEERING_TROUBLESHOOTING_HELP_PATH } from "@/lib/developer-troubleshooting-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

const RETIRED_ENGINEERING_TROUBLESHOOTING_HELP_ALIAS_HREF = "/help/developer-troubleshooting";

function readInboundLabelSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("engineering-troubleshooting help inbound labels and canonical help href (TB-2264)", () => {
  it("maps the canonical help route to the engineering troubleshooting topic label", () => {
    for (const [pathname, expectedLabel] of Object.entries(
      ENGINEERING_TROUBLESHOOTING_HELP_INBOUND_PATH_LABELS,
    )) {
      expect(pageHelpTopicForPathname(pathname)?.label).toBe(expectedLabel);
    }

    expect(ENGINEERING_TROUBLESHOOTING_HELP_TOPIC_LABEL).toBe("How engineering troubleshooting works");
    expect(pageHelpTopicForPathname("/help/engineering-troubleshooting")?.slug).toBe(
      "engineering-troubleshooting",
    );
  });

  it("keeps listed inbound surfaces on canonical engineering-troubleshooting handoffs", () => {
    const pageHelpMap = readInboundLabelSource(ENGINEERING_TROUBLESHOOTING_HELP_INBOUND_LABEL_SOURCE_FILES[0]!);
    const cliUsageSources = readInboundLabelSource(
      ENGINEERING_TROUBLESHOOTING_HELP_INBOUND_LABEL_SOURCE_FILES[1]!,
    );
    const developerSettingsSources = readInboundLabelSource(
      ENGINEERING_TROUBLESHOOTING_HELP_INBOUND_LABEL_SOURCE_FILES[2]!,
    );

    expect(pageHelpMap).toContain("ENGINEERING_TROUBLESHOOTING_HELP_TOPIC_LABEL");
    expect(cliUsageSources).toContain('inAppHelpHref("engineering-troubleshooting")');
    expect(developerSettingsSources).toContain('inAppHelpHref("engineering-troubleshooting")');
  });

  it("never emits retired help alias hrefs from engineering runbook inbound chrome", () => {
    expect(inAppHelpHref("engineering-troubleshooting")).toBe(ENGINEERING_TROUBLESHOOTING_HELP_CANONICAL_HELP_HREF);
    expect(ENGINEERING_TROUBLESHOOTING_HELP_PATH).toBe(ENGINEERING_TROUBLESHOOTING_HELP_CANONICAL_HELP_HREF);

    for (const relativePath of ENGINEERING_TROUBLESHOOTING_HELP_INBOUND_LABEL_SOURCE_FILES) {
      const source = readInboundLabelSource(relativePath);

      expect(source).not.toContain(RETIRED_ENGINEERING_TROUBLESHOOTING_HELP_ALIAS_HREF);
      expect(source).not.toContain('inAppHelpHref("developer-troubleshooting")');
    }
  });
});
