import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { REVIEWS_NEW_MORE_WAYS_TO_START_TITLE, REVIEWS_NEW_PATH_HINTS } from "@/lib/reviews-new-path-copy";
import { REVIEWS_NEW_MORE_WAYS_TO_START_OPEN_PARAM } from "@/lib/reviews/reviews-new-more-ways-to-start-disclosure-url";

import { ReviewsNewMoreWaysToStart } from "./ReviewsNewMoreWaysToStart";

const moreWaysSearchParamsHarness = vi.hoisted(() => {
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
    applyHref(href: string): void {
      try {
        const url = new URL(href, "http://localhost/");
        state.query = url.search.startsWith("?") ? url.search.slice(1) : url.search;
      } catch {
        const qIndex = href.indexOf("?");
        state.query = qIndex >= 0 ? href.slice(qIndex + 1) : "";
      }

      state.windowQuery = state.query;

      for (const listener of listeners) {
        listener();
      }
    },
    applySearchParamsQuery(query: string): void {
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

vi.mock("@/lib/navigation/replace-if-href-changed", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/navigation/replace-if-href-changed")>();

  return {
    ...actual,
    readWindowLocationSearch: () => moreWaysSearchParamsHarness.readWindowLocationSearch(),
    commitHrefIfChanged: (href: string, _options?: { readonly notify?: boolean }) => {
      moreWaysSearchParamsHarness.applyHref(href);

      return true;
    },
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/new",
  useSearchParams: () => new URLSearchParams(moreWaysSearchParamsHarness.state.query),
}));

function MoreWaysSearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    moreWaysSearchParamsHarness.subscribe,
    () => moreWaysSearchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

describe("ReviewsNewMoreWaysToStart", () => {
  beforeEach(() => {
    moreWaysSearchParamsHarness.reset();
  });
  it("lists secondary start paths without rendering their wizards", () => {
    const onSelectPath = vi.fn();

    render(<ReviewsNewMoreWaysToStart onSelectPath={onSelectPath} />);

    expect(screen.getByTestId("reviews-new-more-intake-options")).toBeInTheDocument();
    expect(screen.getByText(REVIEWS_NEW_PATH_HINTS["guided-intake"])).toBeInTheDocument();
    expect(screen.getByText(REVIEWS_NEW_PATH_HINTS.detailed)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("reviews-new-more-path-detailed"));

    expect(onSelectPath).toHaveBeenCalledWith("detailed");
  });

  it("writes more-ways disclosure from useSearchParams when window.location.search lags after soft navigation", () => {
    moreWaysSearchParamsHarness.applySearchParamsQuery("");
    moreWaysSearchParamsHarness.setWindowLocationSearch("staleToolbar=old");

    render(
      <MoreWaysSearchParamsRerenderHost>
        <ReviewsNewMoreWaysToStart onSelectPath={vi.fn()} />
      </MoreWaysSearchParamsRerenderHost>,
    );

    fireEvent.click(screen.getByText(REVIEWS_NEW_MORE_WAYS_TO_START_TITLE));

    if (!moreWaysSearchParamsHarness.state.query.includes(REVIEWS_NEW_MORE_WAYS_TO_START_OPEN_PARAM)) {
      const details = screen.getByTestId("reviews-new-more-intake-options");

      fireEvent(details, new Event("toggle", { bubbles: true }));
    }

    expect(moreWaysSearchParamsHarness.state.query).toContain(REVIEWS_NEW_MORE_WAYS_TO_START_OPEN_PARAM);
    expect(moreWaysSearchParamsHarness.state.query).not.toContain("staleToolbar");
  });

  it("keeps more-ways disclosure closed from useSearchParams when popstate reads lagging window.location.search", async () => {
    moreWaysSearchParamsHarness.applySearchParamsQuery("");
    window.history.replaceState({}, "", `/architecture/reviews/new?${REVIEWS_NEW_MORE_WAYS_TO_START_OPEN_PARAM}=1`);

    render(
      <MoreWaysSearchParamsRerenderHost>
        <ReviewsNewMoreWaysToStart onSelectPath={vi.fn()} />
      </MoreWaysSearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("reviews-new-more-intake-options")).not.toHaveAttribute("open");
    });

    fireEvent(window, new PopStateEvent("popstate"));

    expect(screen.getByTestId("reviews-new-more-intake-options")).not.toHaveAttribute("open");
  });

  it("follows reviewsNewMoreWaysToStartOpen= URL changes without a popstate event", async () => {
    moreWaysSearchParamsHarness.state.query = `${REVIEWS_NEW_MORE_WAYS_TO_START_OPEN_PARAM}=1`;

    const view = render(
      <MoreWaysSearchParamsRerenderHost>
        <ReviewsNewMoreWaysToStart onSelectPath={vi.fn()} />
      </MoreWaysSearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("reviews-new-more-intake-options")).toHaveAttribute("open");
    });

    moreWaysSearchParamsHarness.applyHref("/architecture/reviews/new");
    view.rerender(
      <MoreWaysSearchParamsRerenderHost>
        <ReviewsNewMoreWaysToStart onSelectPath={vi.fn()} />
      </MoreWaysSearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("reviews-new-more-intake-options")).not.toHaveAttribute("open");
    });
  });
});
