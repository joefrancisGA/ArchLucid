import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RUN_DETAIL_RECORD_METADATA_OPEN_PARAM } from "@/lib/runs/run-detail-record-metadata-url";

import { RunDetailWorkspaceHeader } from "./RunDetailWorkspaceChrome";

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
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => null,
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
}));

vi.mock("@/components/reviews/ReviewHeaderShareMenu", () => ({
  ReviewHeaderShareMenu: () => <div data-testid="review-header-share-menu" />,
}));

vi.mock("@/components/reviews/ReviewPresenterHeaderButton", () => ({
  ReviewPresenterHeaderButton: () => null,
}));

vi.mock("@/components/reviews/ReviewAskDock", () => ({
  ReviewAskDock: () => <div data-testid="review-ask-dock" />,
}));

vi.mock("@/components/CopyIdButton", () => ({
  CopyIdButton: () => <button type="button">Copy</button>,
}));

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "reviewTab=overview",
  );

  return createElement("div", null, children);
}

const workspaceStatus = {
  label: "Finalized · approval blocked",
  kind: "finalized" as const,
  statusTagKind: "needs-attention" as const,
};

const headerProps = {
  runId: "run-abc",
  h1Title: "Claims API",
  eyebrowLabel: "Claims platform review",
  reviewIdentifierLabel: "run-abc",
  signedReviewRecordId: "manifest-1",
  signedReviewRecordIdLabel: "manifest-1",
  workspaceStatus,
  reviewOwner: null,
  templateLabel: null,
  finalizedAtLabel: "Jan 1, 2026, 12:00 PM",
  packageVersionLabel: "v2",
};

describe("RunDetailWorkspaceHeader URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");
  });

  it("writes record metadata disclosure from useSearchParams when window.location.search lags after soft navigation", async () => {
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?reviewTab=findings&q=stale-payment",
    );

    const { rerender } = render(
      <SearchParamsRerenderHost>
        <RunDetailWorkspaceHeader {...headerProps} />
      </SearchParamsRerenderHost>,
    );

    searchParamsHarness.applyQuery("reviewTab=overview");
    rerender(
      <SearchParamsRerenderHost>
        <RunDetailWorkspaceHeader {...headerProps} />
      </SearchParamsRerenderHost>,
    );

    fireEvent.click(screen.getByText(/Record metadata/i));

    await waitFor(() => {
      expect(window.location.pathname + window.location.search).toBe(
        `/architecture/reviews/run-abc?reviewTab=overview&${RUN_DETAIL_RECORD_METADATA_OPEN_PARAM}=1`,
      );
    });
  });

  it("follows runRecordMetaOpen query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <RunDetailWorkspaceHeader {...headerProps} />
      </SearchParamsRerenderHost>,
    );

    const metadataDetails = () => screen.getByTestId("run-detail-record-metadata-disclosure");
    expect(metadataDetails()).not.toHaveAttribute("open");

    searchParamsHarness.applyQuery(`reviewTab=overview&${RUN_DETAIL_RECORD_METADATA_OPEN_PARAM}=1`);
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-abc?reviewTab=overview&${RUN_DETAIL_RECORD_METADATA_OPEN_PARAM}=1`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <RunDetailWorkspaceHeader {...headerProps} />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(metadataDetails()).toHaveAttribute("open");
    });
  });
});
