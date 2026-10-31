import { fireEvent, render, screen } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RunSummary } from "@/types/authority";

import { REVIEWS_HUB_FILTER_FINALIZED_LABEL } from "./reviews-hub-copy";
import { ReviewsHubReviewInventory } from "./ReviewsHubReviewInventory";
import { deriveReviewsWorkspaceSummary } from "./reviews-workspace-summary";

const sampleRun = {
  runId: "review-url-sync-001",
  projectId: "claims-intake",
  description: "Claims intake modernization",
  createdUtc: "2026-01-15T12:00:00.000Z",
  hasFindingsSnapshot: true,
  findingCount: 2,
} satisfies RunSummary;

const sampleRuns = [sampleRun] as const;
const sampleSummary = deriveReviewsWorkspaceSummary([...sampleRuns]);

const searchParamsHarness = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const state = { query: "" };

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
    reset(): void {
      state.query = "";
    },
  };
});

const committedHrefs = vi.hoisted(() => [] as string[]);

vi.mock("@/lib/navigation/replace-if-href-changed", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/navigation/replace-if-href-changed")>();

  return {
    ...actual,
    commitHrefIfChanged: (href: string) => {
      committedHrefs.push(href);

      return true;
    },
  };
});

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: false }),
}));

vi.mock("@/hooks/use-shell-in-flight-operations", () => ({
  useShellInFlightOperations: () => [],
}));

vi.mock("@/hooks/use-rehydrate-in-flight-from-architecture", () => ({
  useRehydrateInFlightFromWorkingContinuity: () => undefined,
}));

vi.mock("@/hooks/use-architecture-draft-registry-entries", () => ({
  useArchitectureDraftRegistryEntries: () => [],
}));

vi.mock("@/hooks/use-archived-reviews-client-cache", () => ({
  useArchivedReviewsClientCache: () => ({ archivedRuns: [] }),
}));

vi.mock("@/hooks/use-favorite-reviews", () => ({
  useFavoriteReviews: () => ({ isFavorite: () => false }),
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

vi.mock("@/lib/operator/operator-scope-storage", async () => {
  const actual = await vi.importActual<typeof import("@/lib/operator/operator-scope-storage")>(
    "@/lib/operator/operator-scope-storage",
  );

  return {
    ...actual,
    readOperatorScopeFromStorage: () => null,
  };
});

vi.mock("./ReviewsHubInventoryTable", () => ({
  ReviewsHubInventoryTable: () => null,
}));

vi.mock("./ReviewsHubInFlightAnalysisDesk", () => ({
  ReviewsHubInFlightAnalysisDesk: () => null,
}));

vi.mock("./ReviewsHubActiveFiltersStrip", () => ({
  ReviewsHubActiveFiltersStrip: () => null,
}));

vi.mock("./ReviewsHubSummaryRow", () => ({
  ReviewsHubSummaryRow: () => null,
}));

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

describe("ReviewsHubReviewInventory URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    committedHrefs.length = 0;
    window.history.replaceState({}, "", "/architecture/reviews?staleToolbar=q-old");
  });

  it("writes inventory filter from useSearchParams when window.location.search lags after soft navigation", () => {
    searchParamsHarness.state.query = "q=payments";

    const { rerender } = render(
      <SearchParamsRerenderHost>
        <ReviewsHubReviewInventory runs={sampleRuns} summary={sampleSummary} />
      </SearchParamsRerenderHost>,
    );

    searchParamsHarness.applyQuery("q=payments");
    rerender(
      <SearchParamsRerenderHost>
        <ReviewsHubReviewInventory runs={sampleRuns} summary={sampleSummary} />
      </SearchParamsRerenderHost>,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(`Filter reviews: ${REVIEWS_HUB_FILTER_FINALIZED_LABEL}`, "i"),
      }),
    );

    expect(committedHrefs.length).toBeGreaterThan(0);
    const lastHref = committedHrefs.at(-1) ?? "";
    expect(lastHref).toContain("filter=finalized");
    expect(lastHref).toContain("q=payments");
    expect(lastHref).not.toContain("staleToolbar");
    expect(lastHref).not.toContain("q-old");
  });
});
