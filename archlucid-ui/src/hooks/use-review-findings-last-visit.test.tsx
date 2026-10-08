import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useRunDetailFindingsToolbarState } from "@/components/findings/use-run-detail-findings-toolbar-state";

import {
  buildReviewFindingsLastVisitHref,
  reviewFindingsLastVisitHasUrlParams,
} from "@/lib/findings/review-findings-last-visit-url";
import {
  clearReviewFindingsLastVisitStorage,
  patchReviewFindingsLastVisit,
  readReviewFindingsLastVisit,
} from "@/lib/findings/review-findings-last-visit-storage";
import {
  resetReviewFindingsLastVisitRestoreStateForTests,
  useReviewFindingsLastVisitPersist,
  useReviewFindingsLastVisitRestore,
} from "@/hooks/use-review-findings-last-visit";

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-1",
}));

function RestoreProbe(props: { readonly runId: string }) {
  useReviewFindingsLastVisitRestore({ runId: props.runId, enabled: true });

  return null;
}

function ToolbarRestoreProbe() {
  const toolbar = useRunDetailFindingsToolbarState();

  useReviewFindingsLastVisitRestore({ runId: "run-1", enabled: true });
  useReviewFindingsLastVisitPersist({
    runId: "run-1",
    enabled: true,
    filter: toolbar.filter,
    jobView: toolbar.jobView,
    searchQuery: toolbar.searchQuery,
    ownerFilter: toolbar.ownerFilter,
    domainFilter: toolbar.domainFilter,
    originFilter: toolbar.originFilter,
    groundingFilter: toolbar.groundingFilter,
    sort: toolbar.sort,
    classificationBand: "decision-grade",
    hideGenericLowDensity: false,
  });

  return <span data-testid="toolbar-filter">{toolbar.filter}</span>;
}

describe("useReviewFindingsLastVisitRestore", () => {
  afterEach(() => {
    clearReviewFindingsLastVisitStorage();
    resetReviewFindingsLastVisitRestoreStateForTests();
    window.history.replaceState({}, "", "/");
  });

  it("restores again when the same run remounts with a bare findings URL", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");

    patchReviewFindingsLastVisit("run-1", {
      filter: "high",
      searchQuery: "auth",
      classificationBand: "checklist",
    });

    window.history.replaceState({}, "", "/architecture/reviews/run-1?reviewTab=findings");

    const { unmount } = render(<RestoreProbe runId="run-1" />);

    expect(replaceState.mock.calls.some((call) => String(call[2] ?? "").includes("findingsFilter=high"))).toBe(
      true,
    );

    unmount();
    replaceState.mockClear();
    window.history.replaceState({}, "", "/architecture/reviews/run-1?reviewTab=findings");
    replaceState.mockClear();

    render(<RestoreProbe runId="run-1" />);

    expect(replaceState).toHaveBeenCalled();
    const nextHref = String(replaceState.mock.calls[0]?.[2] ?? "");
    expect(nextHref).toContain("findingsFilter=high");

    replaceState.mockRestore();
  });

  it("updates the findings toolbar when last-visit restore writes the filter into the URL", () => {
    patchReviewFindingsLastVisit("run-1", {
      filter: "high",
    });

    window.history.replaceState({}, "", "/architecture/reviews/run-1?reviewTab=findings");

    render(<ToolbarRestoreProbe />);

    expect(screen.getByTestId("toolbar-filter").textContent).toBe("high");
    expect(readReviewFindingsLastVisit("run-1")?.filter).toBe("high");
  });

  it("restores stored filters on mount when the URL has no toolbar params", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");

    window.history.replaceState({}, "", "/architecture/reviews/run-1?reviewTab=findings");

    patchReviewFindingsLastVisit("run-1", {
      filter: "high",
      searchQuery: "auth",
      classificationBand: "checklist",
    });

    replaceState.mockClear();

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
