import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { FindingDetailPageModel } from "./finding-detail-page-model";
import type { FindingInspectPayload } from "@/types/finding-inspect";

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-1/findings/finding-1",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("./FindingDetailOperationalActions", () => ({
  FindingDetailOperationalActions: () => <div data-testid="finding-detail-operational-actions" />,
}));

vi.mock("./FindingDetailDecisionSummary", () => ({
  FindingDetailDecisionSummary: () => <div data-testid="finding-detail-decision-summary" />,
}));

vi.mock("@/components/findings/FindingPolicyCitationHero", () => ({
  FindingPolicyCitationHero: () => <div data-testid="finding-policy-citation-hero" />,
}));

vi.mock("../FindingInspectWhyMattersSection", () => ({
  FindingInspectWhyMattersSection: () => null,
}));

vi.mock("../FindingInspectRecommendedActionSection", () => ({
  FindingInspectRecommendedActionSection: () => null,
}));

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
  FindingAskInlinePanel: () => <div data-testid="finding-ask-inline-panel" />,
}));

vi.mock("../FindingInspectItsmWorkflowPanel", () => ({
  FindingInspectItsmWorkflowPanel: () => <div data-testid="finding-itsm-workflow-panel" />,
}));

vi.mock("@/components/ProductLearningFeedbackControls", () => ({
  ProductLearningFeedbackControls: () => <div data-testid="product-learning-feedback" />,
}));

vi.mock("@/components/operator/OperatorEvidenceLimitsFooter", () => ({
  OperatorEvidenceLimitsFooter: ({
    findingIdForInspectLink,
  }: {
    findingIdForInspectLink?: string | null;
  }) => (
    <footer data-testid="operator-evidence-limits-footer" data-inspect-link={findingIdForInspectLink ?? ""} />
  ),
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isNextPublicDemoMode: () => false,
  isOperatorExperienceFullShellEnv: () => true,
  isBuyerPolishedOperatorShellEnv: () => true,
}));

import { FindingDetailPageView } from "./FindingDetailPageView";

const inspectPayload: FindingInspectPayload = {
  findingId: "finding-1",
  typedPayload: null,
  decisionRuleId: "rule-1",
  decisionRuleName: "Sample rule",
  evidence: [],
  recommendedActions: ["Review access controls"],
  auditRowId: null,
  runId: "run-1",
  manifestVersion: "v1",
  confidenceLevel: "High",
};

function buyerModel(overrides: Partial<FindingDetailPageModel> = {}): FindingDetailPageModel {
  return {
    runId: "run-1",
    findingIdRouteParam: "finding-1",
    decodedFindingId: "finding-1",
    inspectPayload,
    inspectFailure: null,
    buyerPolishedShell: true,
    linkedManifestHref: "/governance/signed-records/m1",
    pageTitle: "Over-permissive storage access",
    findingIsPhi: false,
    runExecutionFootnote: null,
    ...overrides,
  };
}

describe("FindingDetailPageView buyer polish", () => {
  it("renders back-link wayfinding with contextual help and no top-row evidence trace link", () => {
    render(<FindingDetailPageView model={buyerModel()} />);

    expect(screen.getByTestId("finding-detail-wayfinding")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Breadcrumb" })).toBeNull();
    expect(screen.getByTestId("finding-detail-back-to-review")).toHaveAttribute("href", "/architecture/reviews/run-1");
    expect(screen.getByTestId("finding-detail-back-to-findings")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-1?reviewTab=findings",
    );
    expect(screen.queryByRole("link", { name: "Open evidence trace" })).toBeNull();
  });

  it("renders always-visible sponsor plain-English rewrite (TB-2192)", () => {
    render(<FindingDetailPageView model={buyerModel()} />);

    expect(screen.getByTestId("sponsor-plain-english-finding")).toBeInTheDocument();
    expect(screen.getByTestId("sponsor-plain-english-finding-body")).toBeInTheDocument();
    expect(screen.getByText("Explain for a sponsor")).toBeInTheDocument();
  });

  it("omits footer inspect link for buyer shell and nests ask/itsm under work-with section", () => {
    render(<FindingDetailPageView model={buyerModel()} />);

    expect(screen.getByTestId("operator-evidence-limits-footer")).toHaveAttribute("data-inspect-link", "");
    expect(screen.getByText("Work with this finding")).toBeInTheDocument();
    expect(screen.getAllByTestId("finding-ask-inline-panel")).toHaveLength(1);
    expect(screen.getAllByTestId("finding-itsm-workflow-panel")).toHaveLength(1);
  });

  it("suppresses buyer hero theater when inspect load fails", () => {
    render(
      <FindingDetailPageView
        model={buyerModel({
          inspectPayload: null,
          inspectFailure: {
            message: "Unavailable",
            correlationId: "corr-1",
            problem: null,
          },
        })}
      />,
    );

    expect(screen.queryByRole("heading", { level: 1, name: "Over-permissive storage access" })).toBeNull();
    expect(screen.getByText("Finding detail temporarily unavailable")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to findings" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open evidence trace" })).toBeNull();
  });
});
