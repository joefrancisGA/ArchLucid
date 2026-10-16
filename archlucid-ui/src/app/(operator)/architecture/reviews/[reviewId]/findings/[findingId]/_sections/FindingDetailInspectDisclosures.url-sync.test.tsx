import { act, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FINDING_EVIDENCE_OPEN_PARAM } from "@/lib/findings/finding-detail-inspect-disclosure-url";

import { FindingDetailInspectDisclosures } from "./FindingDetailInspectDisclosures";

vi.mock("../FindingInspectEvidenceSection", () => ({
  FindingInspectEvidenceSection: () => null,
}));

vi.mock("../FindingInspectAuditSection", () => ({
  FindingInspectAuditSection: () => null,
}));

vi.mock("@/components/findings/FindingExplainabilityTracePanel", () => ({
  FindingExplainabilityTracePanel: () => null,
}));

vi.mock("@/components/FindingExplainPanel", () => ({
  FindingExplainPanel: () => null,
}));

vi.mock("@/components/findings/FindingProvenancePanel", () => ({
  FindingProvenancePanel: () => null,
}));

vi.mock("@/components/findings/FindingItsmExportPanel", () => ({
  FindingItsmExportPanel: () => null,
}));

vi.mock("@/components/findings/FindingAskInlinePanel", () => ({
  FindingAskInlinePanel: () => null,
}));

vi.mock("../FindingInspectItsmWorkflowPanel", () => ({
  FindingInspectItsmWorkflowPanel: () => null,
}));

vi.mock("@/components/ProductLearningFeedbackControls", () => ({
  ProductLearningFeedbackControls: () => null,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isOperatorExperienceFullShellEnv: () => false,
  };
});

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
  auditRowId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  runId: "run-1",
  manifestVersion: "v1",
  reasoningTrace: null,
};

describe("FindingDetailInspectDisclosures URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-1/findings/finding-1");
  });

  it("follows findingEvidenceOpen query changes without a popstate event", async () => {
    const renderDisclosures = () => (
      <SearchParamsRerenderHost>
        <FindingDetailInspectDisclosures
          runId="run-1"
          findingIdRouteParam="finding-1"
          decodedFindingId="finding-1"
          inspectPayload={inspectPayload}
          demoFillGaps={false}
          evidenceBasisSummary="Diagram edge cited."
          validationRequirementText="Validate with owner."
          reviewPackageHref="/architecture/reviews/run-1"
          graphEvidenceHref={null}
          linkedManifestHref={null}
          citationModel={null}
        />
      </SearchParamsRerenderHost>
    );

    const { rerender } = render(renderDisclosures());

    const evidenceDetails = () => screen.getByTestId("finding-evidence-collapsible");
    expect(evidenceDetails()).not.toHaveAttribute("open");

    act(() => {
      searchParamsHarness.applyQuery(`${FINDING_EVIDENCE_OPEN_PARAM}=1`);
      window.history.replaceState(
        {},
        "",
        `/architecture/reviews/run-1/findings/finding-1?${FINDING_EVIDENCE_OPEN_PARAM}=1`,
      );
    });
    rerender(renderDisclosures());

    await waitFor(() => {
      expect(evidenceDetails()).toHaveAttribute("open");
    });
  });
});
