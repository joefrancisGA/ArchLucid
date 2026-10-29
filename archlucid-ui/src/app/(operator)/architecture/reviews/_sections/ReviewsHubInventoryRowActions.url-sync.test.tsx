import { fireEvent, render, screen } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RunSummary } from "@/types/authority";

import type { ReviewsHubReviewRowDisplay } from "./reviews-hub-package-display";
import { ReviewsHubInventoryRowActions } from "./ReviewsHubInventoryRowActions";

const searchParamsHarness = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const state = { query: "", windowQuery: null as string | null };

  return {
    state,
    subscribe(listener: () => void): () => void {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    applyQuery(query: string): void {
      state.query = query;

      for (const listener of listeners) {
        listener();
      }
    },
    setWindowLocationSearch(query: string): void {
      state.windowQuery = query;
    },
    readWindowLocationSearch(): string {
      return state.windowQuery ?? state.query;
    },
    reset(): void {
      state.query = "";
      state.windowQuery = null;
    },
  };
});

const committedHrefs = vi.hoisted(() => [] as string[]);

vi.mock("@/lib/navigation/replace-if-href-changed", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/navigation/replace-if-href-changed")>();

  return {
    ...actual,
    readWindowLocationSearch: () => searchParamsHarness.readWindowLocationSearch(),
    commitHrefIfChanged: (href: string) => {
      committedHrefs.push(href);

      return true;
    },
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews",
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/components/reviews/PinReviewToDeskButton", () => ({
  PinReviewToDeskButton: () => null,
}));

vi.mock("@/components/reviews/ReviewArchiveControl", () => ({
  ReviewArchiveControl: () => null,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      name: "Taylor Morgan",
      provenance: "auth-me",
      roleClaimValues: [],
      primaryAppRole: "Operator",
      maxAuthority: "ExecuteAuthority",
      authorityRank: 2,
      hasEnterpriseOperatorSurfaces: true,
      hasCommittedArchitectureReview: false,
      hasRecognizedArchLucidRole: true,
      permissionClaimValues: [],
    },
    isAuthorityLoading: false,
    callerAuthorityRank: 2,
  }),
}));

vi.mock("@/hooks/use-work-ownership-delete-policy-query", () => ({
  useWorkOwnershipDeletePolicyQuery: () => ({
    data: { allowCreatorDeleteOwnedWork: true },
  }),
}));

vi.mock("@/lib/review-archive-eligibility", () => ({
  canArchiveReview: () => true,
}));

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

const sampleRun = {
  runId: "review-overflow-001",
  projectId: "claims-intake",
  description: "Claims intake modernization",
  createdUtc: "2026-01-15T12:00:00.000Z",
  hasFindingsSnapshot: true,
  findingCount: 2,
} satisfies RunSummary;

const sampleRow = {
  runId: "review-overflow-001",
  reviewTitle: "Claims intake modernization",
  reviewTitlePrimary: "Claims intake modernization",
  reviewTitleKindLabel: null,
  architectureName: "Claims intake",
  reviewHref: "/architecture/reviews/review-overflow-001",
  primaryAction: { label: "Review findings", href: "/architecture/reviews/review-overflow-001" },
  architectureId: "arch-001",
} as ReviewsHubReviewRowDisplay;

describe("ReviewsHubInventoryRowActions URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    committedHrefs.length = 0;
    window.history.replaceState({}, "", "/architecture/reviews?staleToolbar=q-old");
  });

  it("writes row overflow disclosure from useSearchParams when window.location.search lags after soft navigation", () => {
    searchParamsHarness.applyQuery("q=payments");
    searchParamsHarness.setWindowLocationSearch("q=payments&staleToolbar=q-old");

    const { rerender } = render(
      <SearchParamsRerenderHost>
        <ReviewsHubInventoryRowActions run={sampleRun} row={sampleRow} />
      </SearchParamsRerenderHost>,
    );

    searchParamsHarness.applyQuery("q=payments");
    rerender(
      <SearchParamsRerenderHost>
        <ReviewsHubInventoryRowActions run={sampleRun} row={sampleRow} />
      </SearchParamsRerenderHost>,
    );

    const summary = screen.getByTestId("reviews-hub-row-overflow-review-overflow-001");
    fireEvent.click(summary);

    if (committedHrefs.length === 0) {
      const details = summary.closest("details");

      if (details !== null) {
        fireEvent(details, new Event("toggle", { bubbles: true }));
      }
    }

    expect(committedHrefs.length).toBeGreaterThan(0);
    const lastHref = committedHrefs.at(-1) ?? "";
    expect(lastHref).toContain("reviewsHubRowOverflowRunId=review-overflow-001");
    expect(lastHref).toContain("q=payments");
    expect(lastHref).not.toContain("staleToolbar");
    expect(lastHref).not.toContain("q-old");
  });
});
