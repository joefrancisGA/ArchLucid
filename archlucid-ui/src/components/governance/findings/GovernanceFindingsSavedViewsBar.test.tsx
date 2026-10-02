import { describe, expect, it } from "vitest";

import { applyFindingsSavedViewFilters } from "./GovernanceFindingsSavedViewsBar";

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
      nlFacets: {},
      groupByResource: false,
      scopedRunId: null,
    });
  });

  it("drops malformed natural-language facets from persisted filters", () => {
    expect(
      applyFindingsSavedViewFilters({
        nlFacets: [],
      } as unknown as Parameters<typeof applyFindingsSavedViewFilters>[0]),
    ).toMatchObject({ nlFacets: {} });
  });
});
