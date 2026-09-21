import { describe, expect, it } from "vitest";

import {
  REMEDIATION_PATTERN_ID_PARAM,
  REMEDIATION_PATTERN_VERSION_PARAM,
  remediationPatternSelectionHrefFromSearch,
  remediationPatternYamlImportHref,
} from "@/lib/remediation-pattern-selection-url";

describe("remediation-pattern-selection-url", () => {
  it("builds selection hrefs with pattern and version params", () => {
    expect(
      remediationPatternSelectionHrefFromSearch(
        "",
        { patternId: "11111111-1111-1111-1111-111111111111", version: "1.0.0" },
        "/security/remediation-patterns",
      ),
    ).toBe(
      `/security/remediation-patterns?${REMEDIATION_PATTERN_ID_PARAM}=11111111-1111-1111-1111-111111111111&${REMEDIATION_PATTERN_VERSION_PARAM}=1.0.0`,
    );
  });

  it("clears version when only pattern is set and drops params when cleared", () => {
    const withPattern = remediationPatternSelectionHrefFromSearch(
      `${REMEDIATION_PATTERN_ID_PARAM}=a&${REMEDIATION_PATTERN_VERSION_PARAM}=1.0.0`,
      { patternId: "a", version: null },
      "/governance/remediation-patterns",
    );

    expect(withPattern).toBe(`/governance/remediation-patterns?${REMEDIATION_PATTERN_ID_PARAM}=a`);

    const cleared = remediationPatternSelectionHrefFromSearch("patternId=a", { patternId: null, version: null }, "/governance/remediation-patterns");

    expect(cleared).toBe("/governance/remediation-patterns");
  });

  it("links empty state to the YAML import anchor", () => {
    expect(remediationPatternYamlImportHref("/security/remediation-patterns")).toBe(
      "/security/remediation-patterns#remediation-pattern-yaml-import",
    );
  });
});
