import { describe, expect, it } from "vitest";

import { GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM } from "./governance-findings-resource-group-disclosure-url";
import { governanceFindingsRegisterFilterHrefFromSearch } from "./governance-findings-register-filter-url";

describe("governanceFindingsRegisterFilterHrefFromSearch", () => {
  it("clears stale resource-group disclosure when register filter changes", () => {
    const href = governanceFindingsRegisterFilterHrefFromSearch(
      `filter=open&groupBy=resource&${GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM}=resource%3Aabc`,
      "expiring-soon",
      "/governance/findings",
    );

    expect(href).toBe("/governance/findings?filter=expiring-soon&groupBy=resource");
    expect(href).not.toContain(GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM);
  });

  it("clears stale resource-group disclosure when clearing register filter to all", () => {
    const href = governanceFindingsRegisterFilterHrefFromSearch(
      `filter=open&groupBy=resource&${GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM}=resource%3Aabc`,
      "all",
      "/governance/findings",
    );

    expect(href).toBe("/governance/findings?groupBy=resource");
    expect(href).not.toContain(GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM);
  });
});
