import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { REVIEW_HEADER_SHARE_MENU_OPEN_PARAM } from "@/lib/reviews/review-header-share-menu-url";

import { ReviewHeaderShareMenu } from "./ReviewHeaderShareMenu";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: false, mode: "guided" }),
}));

vi.mock("@/components/usability/ShareableReviewLinkButton", () => ({
  ShareableReviewLinkButton: () => <div data-testid="shareable-review-link-button" />,
}));

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

const pathnameMock = vi.hoisted(() => ({ value: "/architecture/reviews/run-b" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock.value,
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
}));

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "reviewTab=overview",
  );

  return createElement("div", null, children);
}

describe("ReviewHeaderShareMenu URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    pathnameMock.value = "/architecture/reviews/run-b";
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-a?reviewTab=findings&q=stale-payment",
    );
  });

  it("opens share menu from useSearchParams when window.location.search lags after soft navigation", async () => {
    searchParamsHarness.state.query = "reviewTab=overview";

    render(
      <SearchParamsRerenderHost>
        <ReviewHeaderShareMenu
          runId="run-b"
          isCommitted={false}
          findingsQueueHref="/governance/findings?runId=run-b"
        />
      </SearchParamsRerenderHost>,
    );

    fireEvent.click(screen.getByTestId("review-header-share-menu-trigger"));

    await waitFor(() => {
      expect(window.location.pathname + window.location.search).toBe(
        `/architecture/reviews/run-b?reviewTab=overview&${REVIEW_HEADER_SHARE_MENU_OPEN_PARAM}=1`,
      );
    });
  });

  it("follows shareMenuOpen query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <ReviewHeaderShareMenu
          runId="run-abc"
          isCommitted={false}
          findingsQueueHref="/governance/findings?runId=run-abc"
        />
      </SearchParamsRerenderHost>,
    );

    const trigger = () => screen.getByTestId("review-header-share-menu-trigger");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");

    searchParamsHarness.applyQuery(`reviewTab=overview&${REVIEW_HEADER_SHARE_MENU_OPEN_PARAM}=1`);
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-b?reviewTab=overview&${REVIEW_HEADER_SHARE_MENU_OPEN_PARAM}=1`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <ReviewHeaderShareMenu
          runId="run-abc"
          isCommitted={false}
          findingsQueueHref="/governance/findings?runId=run-abc"
        />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(trigger()).toHaveAttribute("aria-expanded", "true");
    });
    expect(screen.getByTestId("review-header-share-menu-links")).toBeInTheDocument();
  });
});
