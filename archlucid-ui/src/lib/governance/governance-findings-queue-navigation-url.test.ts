import { describe, expect, it } from "vitest";

import { governanceAssignedToMeSortHrefFromSearch } from "@/lib/governance/governance-assigned-to-me-queue-sort-url";
import { governanceFindingsBulkSelectionHrefFromSearch } from "@/lib/governance/governance-findings-bulk-selection-url";
import { governanceFindingsNlFacetsHrefFromSearch } from "@/lib/governance/governance-findings-queue-nl-facets-url";
import { GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM } from "@/lib/governance/governance-findings-resource-group-disclosure-url";
import { EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS } from "@/lib/findings/findings-natural-language-filter";

const STALE_DISCLOSURE = `${GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM}=resource%3Aabc`;

describe("governance findings queue navigation strips stale resource-group disclosure", () => {
  it("governanceFindingsNlFacetsHrefFromSearch clears disclosure when severity facet changes", () => {
    const href = governanceFindingsNlFacetsHrefFromSearch(
      `groupBy=resource&severity=low&${STALE_DISCLOSURE}`,
      { ...EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS, severity: "high" },
    );

    expect(href).toContain("severity=high");
    expect(href).not.toContain(GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM);
  });

  it("governanceAssignedToMeSortHrefFromSearch clears disclosure when sort changes", () => {
    const href = governanceAssignedToMeSortHrefFromSearch(
      `groupBy=resource&${STALE_DISCLOSURE}`,
      "due",
      false,
    );

    expect(href).toContain("sort=due");
    expect(href).not.toContain(GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM);
  });

  it("governanceFindingsBulkSelectionHrefFromSearch clears disclosure when bulk selection clears", () => {
    const href = governanceFindingsBulkSelectionHrefFromSearch(
      `bulkFindings=f1&groupBy=resource&${STALE_DISCLOSURE}`,
      [],
    );

    expect(href).not.toContain("bulkFindings=");
    expect(href).not.toContain(GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM);
  });
});
