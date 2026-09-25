import { describe, expect, it } from "vitest";

import {
  filterRemediationPatternRegistry,
  parseRemediationPatternRegistryFilterFromSearch,
  remediationPatternRegistryFilterHrefFromSearch,
  REMEDIATION_PATTERN_REGISTRY_FILTERS,
} from "@/lib/remediation-pattern-registry-filters";

const patterns = [
  {
    patternId: "1",
    patternKey: "a",
    displayName: "A",
    currentApprovedVersion: null,
    createdByActorKey: "x",
    createdUtc: "",
    updatedUtc: "",
  },
  {
    patternId: "2",
    patternKey: "b",
    displayName: "B",
    currentApprovedVersion: "1.0.0",
    createdByActorKey: "x",
    createdUtc: "",
    updatedUtc: "",
  },
];

describe("remediation-pattern-registry-filters", () => {
  it("parses registry filter params", () => {
    expect(parseRemediationPatternRegistryFilterFromSearch("needs-attention")).toBe(
      REMEDIATION_PATTERN_REGISTRY_FILTERS.needsAttention,
    );
    expect(parseRemediationPatternRegistryFilterFromSearch(null)).toBe(REMEDIATION_PATTERN_REGISTRY_FILTERS.all);
  });

  it("filters patterns by attention", () => {
    expect(filterRemediationPatternRegistry(patterns, REMEDIATION_PATTERN_REGISTRY_FILTERS.needsAttention)).toHaveLength(
      1,
    );
    expect(filterRemediationPatternRegistry(patterns, REMEDIATION_PATTERN_REGISTRY_FILTERS.hasApproved)).toHaveLength(1);
  });

  it("builds filter hrefs", () => {
    expect(
      remediationPatternRegistryFilterHrefFromSearch(
        "",
        REMEDIATION_PATTERN_REGISTRY_FILTERS.needsAttention,
        "/security/remediation-patterns",
      ),
    ).toBe("/security/remediation-patterns?registryFilter=needs-attention");
  });
});
