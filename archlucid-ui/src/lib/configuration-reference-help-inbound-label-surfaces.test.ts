import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CONFIGURATION_REFERENCE_HELP_CANONICAL_HELP_HREF,
  CONFIGURATION_REFERENCE_HELP_INBOUND_LABEL_SOURCE_FILES,
  CONFIGURATION_REFERENCE_HELP_INBOUND_PATH_LABELS,
} from "@/lib/configuration-reference-help-inbound-label-surfaces";
import { CONFIGURATION_REFERENCE_HELP_TOPIC_LABEL } from "@/lib/configuration-reference-help-guide-content";
import { CONFIGURATION_REFERENCE_HELP_PATH } from "@/lib/configuration-reference-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

const RETIRED_OPERATOR_AUTH_ROLES_HELP_ALIAS_HREF = "/help/operator-auth-roles";

function readInboundLabelSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("configuration-reference help inbound labels and canonical help href (TB-2270)", () => {
  it("maps the canonical help route to the configuration reference topic label", () => {
    for (const [pathname, expectedLabel] of Object.entries(
      CONFIGURATION_REFERENCE_HELP_INBOUND_PATH_LABELS,
    )) {
      expect(pageHelpTopicForPathname(pathname)?.label).toBe(expectedLabel);
    }

    expect(CONFIGURATION_REFERENCE_HELP_TOPIC_LABEL).toBe("How configuration reference works");
    expect(pageHelpTopicForPathname("/help/configuration-reference")?.slug).toBe("configuration-reference");
  });

  it("keeps listed inbound surfaces on canonical configuration-reference handoffs", () => {
    const pageHelpMap = readInboundLabelSource(CONFIGURATION_REFERENCE_HELP_INBOUND_LABEL_SOURCE_FILES[0]!);
    const adminConfigurationSources = readInboundLabelSource(
      CONFIGURATION_REFERENCE_HELP_INBOUND_LABEL_SOURCE_FILES[1]!,
    );
    const inAppDocHref = readInboundLabelSource(CONFIGURATION_REFERENCE_HELP_INBOUND_LABEL_SOURCE_FILES[2]!);

    expect(pageHelpMap).toContain("CONFIGURATION_REFERENCE_HELP_TOPIC_LABEL");
    expect(adminConfigurationSources).toContain('inAppHelpHref("configuration-reference")');
    expect(inAppDocHref).toContain('"configuration-reference"');
  });

  it("never emits retired help alias hrefs from configuration reference inbound chrome", () => {
    expect(inAppHelpHref("configuration-reference")).toBe(CONFIGURATION_REFERENCE_HELP_CANONICAL_HELP_HREF);
    expect(CONFIGURATION_REFERENCE_HELP_PATH).toBe(CONFIGURATION_REFERENCE_HELP_CANONICAL_HELP_HREF);

    for (const relativePath of CONFIGURATION_REFERENCE_HELP_INBOUND_LABEL_SOURCE_FILES) {
      const source = readInboundLabelSource(relativePath);

      expect(source).not.toContain(RETIRED_OPERATOR_AUTH_ROLES_HELP_ALIAS_HREF);
      expect(source).not.toContain('inAppHelpHref("operator-auth-roles")');
    }
  });
});
