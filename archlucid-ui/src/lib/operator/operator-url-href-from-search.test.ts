import { describe, expect, it } from "vitest";

import {
  buildOperatorHrefFromSearch,
  operatorBooleanDisclosureHrefFromSearch,
} from "@/lib/operator/operator-url-href-from-search";
import { GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM } from "@/lib/governance/governance-findings-resource-group-disclosure-url";

describe("operator-url-href-from-search", () => {
  it("operatorBooleanDisclosureHrefFromSearch toggles disclosure params", () => {
    expect(
      operatorBooleanDisclosureHrefFromSearch("a=1", true, "/path", "panelOpen"),
    ).toBe("/path?a=1&panelOpen=1");
    expect(operatorBooleanDisclosureHrefFromSearch("panelOpen=1", false, "/path", "panelOpen")).toBe("/path");
  });

  it("buildOperatorHrefFromSearch applies governance queue navigation hygiene", () => {
    const href = buildOperatorHrefFromSearch(
      `${GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM}=rg-a&q=payments`,
      "/governance/findings",
      {
        selectionSwitch: { kind: "governance-findings-queue-navigation" },
        mutate: (params) => {
          params.set("q", "updated");
        },
      },
    );

    expect(href).toBe("/governance/findings?q=updated");
  });
});
