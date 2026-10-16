import { render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReviewWorkspaceMoreTabsMenu } from "@/components/reviews/ReviewWorkspaceMoreTabsMenu";
import { REVIEW_WORKSPACE_MORE_TABS_OPEN_PARAM } from "@/lib/reviews/review-workspace-more-tabs-url";

const commitHrefIfChanged = vi.hoisted(() => vi.fn(() => false));

const moreTabsSearchParamsHarness = vi.hoisted(() => {
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

vi.mock("@/lib/navigation/replace-if-href-changed", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/navigation/replace-if-href-changed")>();

  return {
    ...actual,
    commitHrefIfChanged,
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/demo-run-id",
  useSearchParams: () => new URLSearchParams(moreTabsSearchParamsHarness.state.query),
}));

function MoreTabsSearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    moreTabsSearchParamsHarness.subscribe,
    () => moreTabsSearchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

const menuProps = {
  lifecycle: "in_review" as const,
  moreTabIds: ["evidence", "activity"] as const,
  activeTab: "overview" as const,
  onTabChange: () => undefined,
};

describe("ReviewWorkspaceMoreTabsMenu", () => {
  beforeEach(() => {
    commitHrefIfChanged.mockClear();
    moreTabsSearchParamsHarness.reset();
    window.history.replaceState(null, "", "/architecture/reviews/demo-run-id");
  });

  it("does not commit href churn when the menu mounts closed", async () => {
    render(
      <ReviewWorkspaceMoreTabsMenu
        lifecycle={menuProps.lifecycle}
        moreTabIds={menuProps.moreTabIds}
        activeTab={menuProps.activeTab}
        onTabChange={menuProps.onTabChange}
      />,
    );

    await waitFor(() => {
      expect(commitHrefIfChanged).not.toHaveBeenCalled();
    });
  });

  it("follows reviewMoreTabsOpen query changes without a popstate event", async () => {
    const view = render(
      <MoreTabsSearchParamsRerenderHost>
        <ReviewWorkspaceMoreTabsMenu
          lifecycle={menuProps.lifecycle}
          moreTabIds={menuProps.moreTabIds}
          activeTab={menuProps.activeTab}
          onTabChange={menuProps.onTabChange}
        />
      </MoreTabsSearchParamsRerenderHost>,
    );

    expect(screen.getByTestId("review-detail-workspace-more-tabs")).toHaveAttribute("aria-expanded", "false");

    moreTabsSearchParamsHarness.applyQuery(`${REVIEW_WORKSPACE_MORE_TABS_OPEN_PARAM}=1`);
    window.history.replaceState(
      null,
      "",
      `/architecture/reviews/demo-run-id?${REVIEW_WORKSPACE_MORE_TABS_OPEN_PARAM}=1`,
    );
    view.rerender(
      <MoreTabsSearchParamsRerenderHost>
        <ReviewWorkspaceMoreTabsMenu
          lifecycle={menuProps.lifecycle}
          moreTabIds={menuProps.moreTabIds}
          activeTab={menuProps.activeTab}
          onTabChange={menuProps.onTabChange}
        />
      </MoreTabsSearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("review-detail-workspace-more-tabs")).toHaveAttribute("aria-expanded", "true");
    });
  });
});
