import { act, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FINDING_VIEW_EVIDENCE_OPEN_PARAM } from "@/lib/findings/finding-view-evidence-disclosure-url";

import { FindingInspectViewEvidenceCollapsible } from "./FindingInspectViewEvidenceCollapsible";

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

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-1/findings/finding-1",
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
  useRouter: () => ({ replace: vi.fn() }),
}));

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

describe("FindingInspectViewEvidenceCollapsible URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-1/findings/finding-1");
  });

  it("follows findingViewEvidenceOpen query changes without a popstate event", async () => {
    const renderCollapsible = () => (
      <SearchParamsRerenderHost>
        <FindingInspectViewEvidenceCollapsible>
          <p>Evidence body</p>
        </FindingInspectViewEvidenceCollapsible>
      </SearchParamsRerenderHost>
    );

    const { rerender } = render(renderCollapsible());

    const details = () => screen.getByTestId("finding-evidence-collapsible");
    expect(details()).not.toHaveAttribute("open");

    act(() => {
      searchParamsHarness.applyQuery(`${FINDING_VIEW_EVIDENCE_OPEN_PARAM}=1`);
      window.history.replaceState(
        {},
        "",
        `/architecture/reviews/run-1/findings/finding-1?${FINDING_VIEW_EVIDENCE_OPEN_PARAM}=1`,
      );
    });
    rerender(renderCollapsible());

    await waitFor(() => {
      expect(details()).toHaveAttribute("open");
    });
  });
});
