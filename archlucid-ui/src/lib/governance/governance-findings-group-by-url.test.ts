import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_FINDINGS_GROUP_BY_PARAM,
  governanceFindingsGroupByHrefFromSearch,
} from "./governance-findings-group-by-url";
import { GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM } from "./governance-findings-resource-group-disclosure-url";

describe("governanceFindingsGroupByHrefFromSearch", () => {
  it("clears stale resource-group disclosure when group-by is turned off", () => {
    const href = governanceFindingsGroupByHrefFromSearch(
      `${GOVERNANCE_FINDINGS_GROUP_BY_PARAM}=resource&${GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM}=resource%3Aabc`,
      false,
      "/governance/findings",
    );

    expect(href).toBe("/governance/findings");
    expect(href).not.toContain(GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM);
    expect(href).not.toContain(`${GOVERNANCE_FINDINGS_GROUP_BY_PARAM}=`);
  });
});
