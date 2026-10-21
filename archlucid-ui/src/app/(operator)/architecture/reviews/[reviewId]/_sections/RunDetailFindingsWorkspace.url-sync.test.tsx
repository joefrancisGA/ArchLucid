import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { REVIEW_FINDINGS_CLASSIFICATION_BAND_PARAM } from "@/lib/findings/review-findings-last-visit-url";
import { resetReviewFindingsLastVisitRestoreStateForTests } from "@/hooks/use-review-findings-last-visit";

import { RunDetailFindingsWorkspace } from "./RunDetailFindingsWorkspace";

const searchParamsHarness = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const state = { query: "reviewTab=findings" };

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
      state.query = "reviewTab=findings";
    },
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-1",
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/hooks/useArchitectWorkspaceChrome", () => ({
  useArchitectWorkspaceChrome: () => true,
}));

vi.mock("@/components/findings/RunDetailFindingsCardViewLazy", () => ({
  RunDetailFindingsCardViewLazy: () => <div data-testid="findings-card-view-stub" />,
}));

vi.mock("@/components/findings/RunDetailFindingsDenseTable", () => ({
  RunDetailFindingsDenseTable: () => <div data-testid="run-detail-findings-dense-table-stub" />,
}));

vi.mock("@/components/findings/FindingsItsmExportToolbar", () => ({
  FindingsItsmExportToolbar: () => null,
}));

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "reviewTab=findings",
  );

  return createElement("div", null, children);
}

function finding(overrides: Partial<QuickDecisionFinding>): QuickDecisionFinding {
  return {
    findingId: "f-default",
    title: "Finding",
    recommendation: "Fix it.",
    severityValue: 1,
    findingOrder: 0,
    aiReasoning: { wireJson: "{}", reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    enforcementTier: "PolicyViolation",
    confidenceLevel: "High",
    ...overrides,
  };
}

describe("RunDetailFindingsWorkspace URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    resetReviewFindingsLastVisitRestoreStateForTests();
    window.history.replaceState({}, "", "/architecture/reviews/run-1?reviewTab=findings");
  });

  it("writes classification band from useSearchParams when window.location.search lags after soft navigation", async () => {
    const findings = [
      finding({
        findingId: "f-checklist",
        classification: "ChecklistFinding",
        severityValue: 1,
        findingOrder: 0,
      }),
    ];

    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-1?reviewTab=findings&q=stale-payment",
    );

    const { rerender } = render(
      <SearchParamsRerenderHost>
        <RunDetailFindingsWorkspace runId="run-1" findings={findings} packageCommitted={true} />
      </SearchParamsRerenderHost>,
    );

    searchParamsHarness.applyQuery("reviewTab=findings");
    rerender(
      <SearchParamsRerenderHost>
        <RunDetailFindingsWorkspace runId="run-1" findings={findings} packageCommitted={true} />
      </SearchParamsRerenderHost>,
    );

    fireEvent.click(screen.getByTestId("run-detail-findings-band-checklist"));

    await waitFor(() => {
      expect(window.location.pathname + window.location.search).toBe(
        `/architecture/reviews/run-1?reviewTab=findings&${REVIEW_FINDINGS_CLASSIFICATION_BAND_PARAM}=checklist`,
      );
    });
  });

  it("follows findingsBand query changes without a popstate event", async () => {
    const findings = [
      finding({
        findingId: "f-checklist",
        classification: "ChecklistFinding",
        severityValue: 1,
        findingOrder: 0,
      }),
    ];

    const { rerender } = render(
      <SearchParamsRerenderHost>
        <RunDetailFindingsWorkspace runId="run-1" findings={findings} packageCommitted={true} />
      </SearchParamsRerenderHost>,
    );

    expect(screen.getByTestId("run-detail-findings-band-decision-grade")).toHaveAttribute("aria-selected", "true");

    searchParamsHarness.applyQuery(`reviewTab=findings&${REVIEW_FINDINGS_CLASSIFICATION_BAND_PARAM}=checklist`);
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-1?reviewTab=findings&${REVIEW_FINDINGS_CLASSIFICATION_BAND_PARAM}=checklist`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <RunDetailFindingsWorkspace runId="run-1" findings={findings} packageCommitted={true} />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("run-detail-findings-band-checklist")).toHaveAttribute("aria-selected", "true");
    });
  });

  it("resets classification band from useSearchParams when runId changes before window.location.search catches up", async () => {
    const findings = [
      finding({
        findingId: "f-checklist",
        classification: "ChecklistFinding",
        severityValue: 1,
        findingOrder: 0,
      }),
    ];

    searchParamsHarness.applyQuery(`reviewTab=findings&${REVIEW_FINDINGS_CLASSIFICATION_BAND_PARAM}=checklist`);
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-1?reviewTab=findings&${REVIEW_FINDINGS_CLASSIFICATION_BAND_PARAM}=checklist`,
    );

    const { rerender } = render(
      <SearchParamsRerenderHost>
        <RunDetailFindingsWorkspace runId="run-1" findings={findings} packageCommitted={true} />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("run-detail-findings-band-checklist")).toHaveAttribute("aria-selected", "true");
    });

    searchParamsHarness.applyQuery("reviewTab=findings");
    rerender(
      <SearchParamsRerenderHost>
        <RunDetailFindingsWorkspace runId="run-2" findings={findings} packageCommitted={true} />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("run-detail-findings-band-decision-grade")).toHaveAttribute("aria-selected", "true");
    });
  });
});
