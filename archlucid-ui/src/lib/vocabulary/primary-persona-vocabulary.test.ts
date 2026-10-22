import { describe, expect, it } from "vitest";

import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { listProductDocumentationEntries } from "@/lib/product-documentation-registry";
import { ROUTE_TITLES } from "@/lib/route-static-titles";
import {
  BANNED_STANDALONE_CUSTOMER_PERSONA_NOUNS,
  containsBannedStandaloneCustomerPersonaNoun,
  PRIMARY_ARCHITECT_PERSONA,
} from "@/lib/vocabulary/primary-persona-vocabulary";

describe("primary-persona-vocabulary (TB-2240)", () => {
  it("uses architect as the primary signed-in persona label", () => {
    expect(PRIMARY_ARCHITECT_PERSONA.label).toBe("Architect");
    expect(PRIMARY_ARCHITECT_PERSONA.workspaceLabel).toBe("Architect workspace");
  });

  it("keeps banned standalone persona nouns out of route titles and nav labels", () => {
    const surfaces = [
      ...Object.values(ROUTE_TITLES),
      ...Object.values(OPERATOR_NAV_GROUP_LABELS),
      ...Object.values(OPERATOR_NAV_LINK_LABELS),
    ];

    for (const copy of surfaces) {
      if (typeof copy !== "string") {
        continue;
      }

      expect(containsBannedStandaloneCustomerPersonaNoun(copy), copy).toBe(false);
    }
  });

  it("keeps banned standalone persona nouns out of customer help titles and summaries", () => {
    for (const entry of listProductDocumentationEntries()) {
      if (entry.audience === "developer") {
        continue;
      }

      for (const copy of [entry.title, entry.summary]) {
        expect(containsBannedStandaloneCustomerPersonaNoun(copy), `${entry.slug}:${copy}`).toBe(false);
      }
    }
  });

  it("documents the retired standalone persona noun", () => {
    expect(BANNED_STANDALONE_CUSTOMER_PERSONA_NOUNS).toContain("operator");
  });
});
