import { act, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FINDING_INSPECT_TECHNICAL_RULE_OPEN_PARAM } from "@/lib/findings/finding-inspect-technical-rule-disclosure-url";

import { FindingInspectWhyMattersSection } from "./FindingInspectWhyMattersSection";

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

const payload = {
  findingId: "finding-1",
  typedPayload: { severity: "High" },
  decisionRuleId: "rule-a",
  decisionRuleName: "Rule A",
  evidence: [],
  recommendedActions: [] as string[],
  auditRowId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  runId: "run-1",
  manifestVersion: "v1",
  reasoningTrace: null,
};

describe("FindingInspectWhyMattersSection URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-1/findings/finding-1");
  });

  it("follows findingInspectTechnicalRuleOpen query changes without a popstate event", async () => {
    const renderSection = () => (
      <SearchParamsRerenderHost>
        <FindingInspectWhyMattersSection
          payload={payload}
          variant="detail"
          demoFillGaps={false}
          whyThisMattersNarrative="Because intake must minimize PHI."
        />
      </SearchParamsRerenderHost>
    );

    const { rerender } = render(renderSection());

    const details = () => screen.getByText("Technical rule identifier").closest("details") as HTMLDetailsElement;
    expect(details()).not.toHaveAttribute("open");

    act(() => {
      searchParamsHarness.applyQuery(`${FINDING_INSPECT_TECHNICAL_RULE_OPEN_PARAM}=1`);
      window.history.replaceState(
        {},
        "",
        `/architecture/reviews/run-1/findings/finding-1?${FINDING_INSPECT_TECHNICAL_RULE_OPEN_PARAM}=1`,
      );
    });
    rerender(renderSection());

    await waitFor(() => {
      expect(details()).toHaveAttribute("open");
    });
  });
});
