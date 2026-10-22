import { describe, expect, it } from "vitest";

import { applyFindingsSavedViewFilters } from "./GovernanceFindingsSavedViewsBar";
import { governanceFindingsWorkspaceSavedViewHref } from "@/lib/governance/governance-findings-saved-view-helpers";
import { EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS } from "@/lib/findings/findings-natural-language-filter";

describe("applyFindingsSavedViewFilters", () => {
  it.each([
    ["null", null],
    ["an array", []],
  ])("falls back to empty findings filters when persisted filters are %s", (_label, filters) => {
    expect(
      applyFindingsSavedViewFilters(filters as unknown as Parameters<typeof applyFindingsSavedViewFilters>[0]),
    ).toEqual({
      registerFilter: "all",
      jobView: "needs-my-decision",
      nlFacets: EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS,
      groupByResource: false,
      scopedRunId: null,
    });
  });

  it("drops malformed natural-language facets from persisted filters", () => {
    expect(
      applyFindingsSavedViewFilters({
        nlFacets: [],
      } as unknown as Parameters<typeof applyFindingsSavedViewFilters>[0]),
    ).toMatchObject({ nlFacets: EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS });
  });

  it("does not throw when persisted natural-language facet fields have invalid types", () => {
    const applied = applyFindingsSavedViewFilters({
      nlFacets: { severity: {}, status: "open", titleKeywords: null },
    } as never);

    expect(() => governanceFindingsWorkspaceSavedViewHref(applied, "/governance/findings")).not.toThrow();
  });
});
