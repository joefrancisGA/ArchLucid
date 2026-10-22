import { act, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { extendBuyerPolishedShellVitestMock } from "@/testing/buyer-polished-shell-vitest-override";
import { RUN_EXPLANATION_PROVENANCE_OPEN_PARAM } from "@/lib/runs/run-explanation-provenance-disclosure-url";
import type { RunExplanationSummary } from "@/types/explanation";

import { RunExplanationSection } from "./RunExplanationSection";

vi.mock("@/lib/demo-ui-env", async (importOriginal) =>
  extendBuyerPolishedShellVitestMock(importOriginal),
);

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
  usePathname: () => "/architecture/reviews/r1/runs/run1",
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

const summary: RunExplanationSummary = {
  explanation: {
    rawText: "",
    structured: null,
    confidence: 0.8,
    provenance: {
      agentType: "unit-agent",
      modelId: "gpt-test",
      promptTemplateId: "tpl-1",
      promptTemplateVersion: "v2",
      promptContentHash: "abc",
    },
    summary: "Short summary.",
    keyDrivers: [],
    riskImplications: [],
    costImplications: [],
    complianceImplications: [],
    detailedNarrative: "Long.",
  },
  themeSummaries: ["Theme one"],
  overallAssessment: "Overall OK.",
  riskPosture: "Medium",
  findingCount: 1,
  decisionCount: 1,
  unresolvedIssueCount: 0,
  complianceGapCount: 0,
};

describe("RunExplanationSection URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/r1/runs/run1");
  });

  it("follows runExplanationProvenanceOpen query changes without a popstate event", async () => {
    const renderSection = () => (
      <SearchParamsRerenderHost>
        <RunExplanationSection summary={summary} loading={false} error={null} runId="run1" />
      </SearchParamsRerenderHost>
    );

    const { rerender } = render(renderSection());

    const provenanceDetails = () =>
      screen.getByText("Provenance metadata").closest("details") as HTMLDetailsElement;
    expect(provenanceDetails()).not.toHaveAttribute("open");

    act(() => {
      searchParamsHarness.applyQuery(`${RUN_EXPLANATION_PROVENANCE_OPEN_PARAM}=1`);
      window.history.replaceState(
        {},
        "",
        `/architecture/reviews/r1/runs/run1?${RUN_EXPLANATION_PROVENANCE_OPEN_PARAM}=1`,
      );
    });
    rerender(renderSection());

    await waitFor(() => {
      expect(provenanceDetails()).toHaveAttribute("open");
    });
  });
});
