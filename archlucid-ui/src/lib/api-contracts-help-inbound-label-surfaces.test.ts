import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  API_CONTRACTS_HELP_CANONICAL_HELP_HREF,
  API_CONTRACTS_HELP_INBOUND_LABEL_SOURCE_FILES,
  API_CONTRACTS_HELP_INBOUND_PATH_LABELS,
} from "@/lib/api-contracts-help-inbound-label-surfaces";
import { API_CONTRACTS_HELP_TOPIC_LABEL } from "@/lib/api-contracts-help-guide-content";
import { API_CONTRACTS_HELP_PATH } from "@/lib/api-contracts-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

const RETIRED_API_CONTRACTS_HELP_ALIAS_HREF = "/help/governance-api-contracts";

function readInboundLabelSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("api-contracts help inbound labels and canonical help href (TB-2267)", () => {
  it("maps the canonical help route to the API contracts topic label", () => {
    for (const [pathname, expectedLabel] of Object.entries(API_CONTRACTS_HELP_INBOUND_PATH_LABELS)) {
      expect(pageHelpTopicForPathname(pathname)?.label).toBe(expectedLabel);
    }

    expect(API_CONTRACTS_HELP_TOPIC_LABEL).toBe("How API contracts work");
    expect(pageHelpTopicForPathname("/help/api-contracts")?.slug).toBe("api-contracts");
  });

  it("keeps listed inbound surfaces on canonical api-contracts handoffs", () => {
    const pageHelpMap = readInboundLabelSource(API_CONTRACTS_HELP_INBOUND_LABEL_SOURCE_FILES[0]!);
    const vocabulary = readInboundLabelSource(API_CONTRACTS_HELP_INBOUND_LABEL_SOURCE_FILES[1]!);
    const developerSettings = readInboundLabelSource(API_CONTRACTS_HELP_INBOUND_LABEL_SOURCE_FILES[2]!);

    expect(pageHelpMap).toContain("API_CONTRACTS_HELP_TOPIC_LABEL");
    expect(vocabulary).toContain("API_CONTRACTS_HELP_PATH");
    expect(developerSettings).toContain('inAppHelpHref("engineering-troubleshooting")');
  });

  it("never emits retired help alias hrefs from API contracts inbound chrome", () => {
    expect(inAppHelpHref("api-contracts")).toBe(API_CONTRACTS_HELP_CANONICAL_HELP_HREF);
    expect(API_CONTRACTS_HELP_PATH).toBe(API_CONTRACTS_HELP_CANONICAL_HELP_HREF);

    for (const relativePath of API_CONTRACTS_HELP_INBOUND_LABEL_SOURCE_FILES) {
      const source = readInboundLabelSource(relativePath);

      expect(source).not.toContain(RETIRED_API_CONTRACTS_HELP_ALIAS_HREF);
      expect(source).not.toContain('inAppHelpHref("governance-api-contracts")');
    }
  });
});
