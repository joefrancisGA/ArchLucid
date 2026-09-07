import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OperatorSavedView } from "@/lib/api/operator-saved-views";
import { DEFAULT_FINDING_JOB_VIEW } from "@/lib/findings/finding-job-view";
import { EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS } from "@/lib/findings/findings-natural-language-filter";

import { useGovernanceFindingsQueueSavedViews } from "./use-governance-findings-queue-saved-views";

const routerReplaceMock = vi.fn();
const setRegisterFilterMock = vi.fn();
const setJobViewMock = vi.fn();
const setNlFacetsMock = vi.fn();
const applyGroupByResourceMock = vi.fn();
const onPickReviewForTriageMock = vi.fn();
const clearFacetFiltersMock = vi.fn();

function renderSavedViewsHook(searchQuery: string) {
  const searchParams = new URLSearchParams(searchQuery);

  return renderHook(() =>
    useGovernanceFindingsQueueSavedViews({
      mode: "tenant",
      navHref: "/governance/findings",
      searchParams,
      router: { replace: routerReplaceMock } as never,
      setRegisterFilter: setRegisterFilterMock,
      setJobView: setJobViewMock,
      setNlFacets: setNlFacetsMock,
      applyGroupByResource: applyGroupByResourceMock,
      onPickReviewForTriage: onPickReviewForTriageMock,
      clearFacetFilters: clearFacetFiltersMock,
    }),
  );
}

const workspaceSavedView: OperatorSavedView = {
  id: "saved-workspace-open",
  name: "Workspace open",
  payload: {
    filters: {
      registerFilter: "open",
      jobView: DEFAULT_FINDING_JOB_VIEW,
      nlFacets: EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS,
      groupByResource: false,
      scopedRunId: null,
    },
    sort: null,
    columnVisibility: null,
  },
};

describe("useGovernanceFindingsQueueSavedViews", () => {
  beforeEach(() => {
    routerReplaceMock.mockClear();
    setRegisterFilterMock.mockClear();
    setJobViewMock.mockClear();
    setNlFacetsMock.mockClear();
    applyGroupByResourceMock.mockClear();
    onPickReviewForTriageMock.mockClear();
    clearFacetFiltersMock.mockClear();
  });

  it("clears stale runId when loading a workspace-wide saved view", () => {
    const { result } = renderSavedViewsHook("runId=run-1&filter=expiring-soon");

    result.current.onLoadFindingsSavedView(workspaceSavedView);

    expect(onPickReviewForTriageMock).not.toHaveBeenCalled();
    expect(routerReplaceMock).toHaveBeenCalledWith("/governance/findings?filter=open", { scroll: false });
  });
});
