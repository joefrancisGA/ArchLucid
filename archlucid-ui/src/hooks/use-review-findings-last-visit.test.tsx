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
import { useReviewFindingsLastVisitRestore } from "@/hooks/use-review-findings-last-visit";

const routerReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplace }),
  usePathname: () => "/architecture/reviews/run-1",
  useSearchParams: () => new URLSearchParams("reviewTab=findings"),
}));

function RestoreProbe(props: { readonly runId: string }) {
  useReviewFindingsLastVisitRestore({ runId: props.runId, enabled: true });

  return null;
}

describe("useReviewFindingsLastVisitRestore", () => {
  afterEach(() => {
    clearReviewFindingsLastVisitStorage();
    routerReplace.mockReset();
  });

  it("restores stored filters on mount when the URL has no toolbar params", () => {
    patchReviewFindingsLastVisit("run-1", {
      filter: "high",
      searchQuery: "auth",
      classificationBand: "checklist",
    });

    render(<RestoreProbe runId="run-1" />);

    expect(routerReplace).toHaveBeenCalled();
    const nextHref = String(routerReplace.mock.calls[0]?.[0] ?? "");
    expect(nextHref).toContain("findingsFilter=high");
    expect(nextHref).toContain("q=auth");
    expect(nextHref).toContain("findingsBand=checklist");
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
