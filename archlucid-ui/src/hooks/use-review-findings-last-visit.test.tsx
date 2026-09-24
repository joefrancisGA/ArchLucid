import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildReviewFindingsLastVisitHref,
  reviewFindingsLastVisitHasUrlParams,
} from "@/lib/findings/review-findings-last-visit-url";
import {
  clearReviewFindingsLastVisitStorage,
  patchReviewFindingsLastVisit,
} from "@/lib/findings/review-findings-last-visit-storage";
import {
  resetReviewFindingsLastVisitRestoreStateForTests,
  useReviewFindingsLastVisitRestore,
} from "@/hooks/use-review-findings-last-visit";

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-1",
}));

function RestoreProbe(props: { readonly runId: string }) {
  useReviewFindingsLastVisitRestore({ runId: props.runId, enabled: true });

  return null;
}

describe("useReviewFindingsLastVisitRestore", () => {
  afterEach(() => {
    clearReviewFindingsLastVisitStorage();
    resetReviewFindingsLastVisitRestoreStateForTests();
  });

  it("restores stored filters on mount when the URL has no toolbar params", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");

    patchReviewFindingsLastVisit("run-1", {
      filter: "high",
      searchQuery: "auth",
      classificationBand: "checklist",
    });

    render(<RestoreProbe runId="run-1" />);

    expect(replaceState).toHaveBeenCalled();
    const nextHref = String(replaceState.mock.calls[0]?.[2] ?? "");
    expect(nextHref).toContain("findingsFilter=high");
    expect(nextHref).toContain("q=auth");
    expect(nextHref).toContain("findingsBand=checklist");

    replaceState.mockRestore();
  });

  it("buildReviewFindingsLastVisitHref encodes stored state", () => {
    const href = buildReviewFindingsLastVisitHref(
      "/architecture/reviews/run-1",
      "reviewTab=findings",
      {
        filter: "medium",
        jobView: "triage-open-findings",
        searchQuery: "sql",
        ownerFilter: "",
        domainFilter: "",
        originFilter: "all",
        groundingFilter: "all",
        sort: "trust-then-severity",
        classificationBand: "all",
        hideGenericLowDensity: true,
      },
    );

    expect(href).toContain("findingsFilter=medium");
    expect(href).toContain("q=sql");
    expect(href).toContain("hideGeneric=1");
  });

  it("reviewFindingsLastVisitHasUrlParams is false for tab-only URLs", () => {
    expect(reviewFindingsLastVisitHasUrlParams(new URLSearchParams("reviewTab=findings"))).toBe(false);
    expect(
      reviewFindingsLastVisitHasUrlParams(new URLSearchParams("reviewTab=findings&findingsFilter=high")),
    ).toBe(true);
  });
});
