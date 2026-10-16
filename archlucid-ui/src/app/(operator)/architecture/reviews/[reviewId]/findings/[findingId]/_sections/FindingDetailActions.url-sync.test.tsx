import { act, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FINDING_TECHNICAL_IDS_OPEN_PARAM } from "@/lib/findings/finding-detail-actions-disclosure-url";

import type { FindingDetailPresentation } from "./finding-detail-presentation";
import { FindingDetailActions } from "./FindingDetailActions";

vi.mock("@/components/findings/FindingAskInlinePanel", () => ({
  FindingAskInlinePanel: () => null,
}));

vi.mock("@/components/findings/FindingDidNotThinkOfThatButton", () => ({
  FindingDidNotThinkOfThatButton: () => null,
}));

vi.mock("@/components/findings/FindingIacStubPanel", () => ({
  FindingIacStubPanel: () => null,
}));

vi.mock("../FindingInspectItsmWorkflowPanel", () => ({
  FindingInspectItsmWorkflowPanel: () => null,
}));

vi.mock("@/components/findings/FindingItsmExportPanel", () => ({
  FindingItsmExportPanel: () => null,
}));

vi.mock("@/components/FindingExplainPanel", () => ({
  FindingExplainPanel: () => null,
}));

vi.mock("./FindingDetailNextFindingFooter", () => ({
  FindingDetailNextFindingFooter: () => null,
}));

vi.mock("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailNextReviewFooterClient", () => ({
  RunDetailNextReviewFooterClient: () => null,
}));

vi.mock("@/components/operator/OperatorEvidenceLimitsFooter", () => ({
  OperatorEvidenceLimitsFooter: () => null,
}));

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

const inspectPayload = {
  findingId: "finding-1",
  typedPayload: { severity: "High" },
  decisionRuleId: "rule-a",
  decisionRuleName: "Rule A",
  evidence: [],
  recommendedActions: [] as string[],
  auditRowId: null,
  runId: "run-1",
  manifestVersion: "v1",
  reasoningTrace: null,
};

const presentation: FindingDetailPresentation = {
  model: {
    runId: "run-1",
    findingIdRouteParam: "finding-1",
    decodedFindingId: "finding-1",
    inspectPayload,
    inspectFailure: null,
    buyerPolishedShell: false,
    linkedManifestHref: null,
    pageTitle: "Sample finding",
    findingIsPhi: false,
    runExecutionFootnote: null,
    nextFindingInReview: null,
  },
  crossReviewPriorRunId: null,
  crossReviewLaterRunId: null,
  labels: null,
  graphEvidenceHref: null,
  severityHeadline: "High",
  severityRationale: "Rationale",
  severityConstraintNote: null,
  findingJobView: null,
  confidenceLevel: "High",
  evaluationScore: null,
  policyProvenanceModel: null,
  policyTraceExcerpt: null,
  inspectHref: "/inspect",
  findingsQueueNavHref: "/queue",
  reviewFindingsHref: "/findings",
  reviewPackageHref: "/review",
  linkedManifestHref: null,
  decisionSummary: null,
  evidenceBasisSummary: "Basis",
  demoFillGaps: false,
  whyThisMattersNarrative: null,
  buyerStructuredActions: [],
  buyerRecommendedActionParagraph: null,
  sponsorPlainEnglishInput: { headline: "Headline", body: "Body", chips: [] },
  showBuyerPolishedBody: false,
  buyerHeroSubtitle: "Subtitle",
  transparencyTrail: null,
};

describe("FindingDetailActions URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-1/findings/finding-1");
  });

  it("follows findingTechnicalIdsOpen query changes without a popstate event", async () => {
    const renderActions = () => (
      <SearchParamsRerenderHost>
        <FindingDetailActions presentation={presentation} />
      </SearchParamsRerenderHost>
    );

    const { rerender } = render(renderActions());

    const details = () => screen.getByText("Technical identifiers").closest("details") as HTMLDetailsElement;
    expect(details()).not.toHaveAttribute("open");

    act(() => {
      searchParamsHarness.applyQuery(`${FINDING_TECHNICAL_IDS_OPEN_PARAM}=1`);
      window.history.replaceState(
        {},
        "",
        `/architecture/reviews/run-1/findings/finding-1?${FINDING_TECHNICAL_IDS_OPEN_PARAM}=1`,
      );
    });
    rerender(renderActions());

    await waitFor(() => {
      expect(details()).toHaveAttribute("open");
    });
  });
});
