import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { REVIEW_ARCHIVE_CONFIRM_TITLE } from "@/lib/review-archive-confirm-copy";
import {
  REVIEW_ARCHIVE_CONFIRM_PARAM,
  REVIEW_ARCHIVE_RUN_ID_PARAM,
} from "@/lib/reviews/review-archive-confirm-url";

import { ReviewArchiveControl } from "./ReviewArchiveControl";

const searchParamsHarness = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const state = { query: "reviewTab=overview" };

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
      state.query = "reviewTab=overview";
    },
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-abc",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    callerAuthorityRank: AUTHORITY_RANK.AdminAuthority,
    currentPrincipal: { name: "operator@test", meClaims: [] },
    isAuthorityLoading: false,
  }),
}));

vi.mock("@/hooks/use-work-ownership-delete-policy-query", () => ({
  useWorkOwnershipDeletePolicyQuery: () => ({
    data: { allowCreatorDeleteOwnedWork: true },
  }),
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: false }),
}));

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "reviewTab=overview",
  );

  return createElement("div", null, children);
}

const runProps = {
  runId: "run-abc",
  hasGoldenManifest: false,
  isArchived: false,
  createdByUserId: "creator-1",
};

describe("ReviewArchiveControl URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");
  });

  it("writes archive confirm dialog state from useSearchParams when window.location.search lags after soft navigation", async () => {
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?reviewTab=findings&q=stale-payment",
    );

    const { rerender } = render(
      <SearchParamsRerenderHost>
        <ReviewArchiveControl run={runProps} reviewTitle="Northwind pilot" />
      </SearchParamsRerenderHost>,
    );

    searchParamsHarness.applyQuery("reviewTab=overview");
    rerender(
      <SearchParamsRerenderHost>
        <ReviewArchiveControl run={runProps} reviewTitle="Northwind pilot" />
      </SearchParamsRerenderHost>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Archive review" }));

    await waitFor(() => {
      expect(window.location.pathname + window.location.search).toBe(
        `/architecture/reviews/run-abc?reviewTab=overview&${REVIEW_ARCHIVE_RUN_ID_PARAM}=run-abc&${REVIEW_ARCHIVE_CONFIRM_PARAM}=1`,
      );
    });
  });

  it("follows archiveConfirm query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <ReviewArchiveControl run={runProps} reviewTitle="Northwind pilot" />
      </SearchParamsRerenderHost>,
    );

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

    searchParamsHarness.applyQuery(
      `reviewTab=overview&${REVIEW_ARCHIVE_RUN_ID_PARAM}=run-abc&${REVIEW_ARCHIVE_CONFIRM_PARAM}=1`,
    );
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-abc?reviewTab=overview&${REVIEW_ARCHIVE_RUN_ID_PARAM}=run-abc&${REVIEW_ARCHIVE_CONFIRM_PARAM}=1`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <ReviewArchiveControl run={runProps} reviewTitle="Northwind pilot" />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });
    expect(screen.getByText(REVIEW_ARCHIVE_CONFIRM_TITLE)).toBeInTheDocument();
  });
});
