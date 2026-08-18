import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

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

import type { FindingDetailPageModel } from "./finding-detail-page-model";
import type { FindingInspectPayload } from "@/types/finding-inspect";
import {
  FINDING_DETAIL_CLAIM_HEADING,
  FINDING_DETAIL_PAGE_SUBTITLE_BUYER,
  FINDING_DETAIL_PRIMARY_CONTENT_ID,
  FINDING_DETAIL_SKIP_LINK_LABEL,
} from "./finding-detail-page-copy";
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
    linkedManifestHref: "/governance/sealed-records/m1",
    pageTitle: "Over-permissive storage access",
    findingIsPhi: false,
    runExecutionFootnote: null,
    ...overrides,
  };
}

describe("FindingDetailPageView buyer-polished shell (RRF)", () => {
  it("renders skip link, breadcrumb, buyer subtitle, orientation above body, and hides wayfinding help", () => {
    render(<FindingDetailPageView model={buyerModel()} />);

    expect(screen.getByRole("link", { name: FINDING_DETAIL_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${FINDING_DETAIL_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("finding-detail-breadcrumb")).toBeInTheDocument();
    expect(screen.getByText(FINDING_DETAIL_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: FINDING_DETAIL_CLAIM_HEADING })).toBeInTheDocument();
    expect(screen.getByTestId("finding-detail-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("finding-detail-wayfinding")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("finding-detail-derivation-causal")).not.toBeInTheDocument();

    const primaryContent = screen.getByTestId("finding-detail-primary-content");
    const orderedLandmarks = ["finding-detail-orientation-top", "finding-detail-decision-summary"]
      .map((testId) => primaryContent.querySelector(`[data-testid="${testId}"]`))
      .filter((node): node is HTMLElement => node !== null)
      .map((node) => node.getAttribute("data-testid"));

    expect(orderedLandmarks).toEqual(["finding-detail-orientation-top", "finding-detail-decision-summary"]);
  });
});
