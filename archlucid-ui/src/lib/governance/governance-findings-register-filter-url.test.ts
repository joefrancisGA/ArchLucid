import { describe, expect, it } from "vitest";

import { GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM } from "./governance-findings-resource-group-disclosure-url";
import { governanceFindingsRegisterFilterHrefFromSearch } from "./governance-findings-register-filter-url";

describe("governanceFindingsRegisterFilterHrefFromSearch", () => {

  it("retains hideGeneric when register filter narrows", () => {
    const href = governanceFindingsRegisterFilterHrefFromSearch(
      "hideGeneric=1&filter=open",
      "expiring-soon",
      "/governance/findings",
    );

    expect(href).toBe("/governance/findings?hideGeneric=1&filter=expiring-soon");
  });
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

  it("clears armed preset-remove confirm when register filter changes", () => {
    const href = governanceFindingsRegisterFilterHrefFromSearch(
      "filter=open&removePresetId=preset-1",
      "expiring-soon",
      "/governance/findings",
    );

    expect(href).toBe("/governance/findings?filter=expiring-soon");
    expect(href).not.toContain("removePresetId=");
  });  it("clears armed preset-remove confirm when register filter widens to all", () => {
    const href = governanceFindingsRegisterFilterHrefFromSearch(
      "filter=expiring-soon&removePresetId=preset-1",
      "all",
      "/governance/findings",
    );

    expect(href).toBe("/governance/findings");
    expect(href).not.toContain("removePresetId=");
    expect(href).not.toContain("filter=");
  });

  it("retains triage focusedFinding when register filter widens to all", () => {
    const href = governanceFindingsRegisterFilterHrefFromSearch(
      "focusedFinding=finding-1&filter=expiring-soon",
      "all",
      "/governance/findings",
    );

    expect(href).toBe("/governance/findings?focusedFinding=finding-1");
    expect(href).not.toContain("filter=");
  });
});