import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const productLineState = vi.hoisted(() => ({
  current: "security" as "architecture" | "security",
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: productLineState.current }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-1/findings/finding-1",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => null,
}));

vi.mock("./FindingDetailHeader", () => ({
  FindingDetailHeader: () => <header data-testid="finding-detail-header-mock" />,
}));

vi.mock("./FindingDetailInspectBody", () => ({
  FindingDetailInspectBody: () => <div data-testid="finding-detail-inspect-body-mock" />,
}));

vi.mock("./FindingDetailActions", () => ({
  FindingDetailActions: () => <div data-testid="finding-detail-actions-mock" />,
}));

vi.mock("@/components/security/SecurityEvidencePathInspectPanel", () => ({
  SecurityEvidencePathInspectPanel: () => <section data-testid="security-evidence-path-inspect-panel" />,
}));

import type { FindingDetailPageModel } from "./finding-detail-page-model";
import type { FindingInspectPayload } from "@/types/finding-inspect";
import { FindingDetailPageView } from "./FindingDetailPageView";

const inspectPayload: FindingInspectPayload = {
  findingId: "finding-1",
  typedPayload: { title: "Public storage exposure" },
  decisionRuleId: null,
  decisionRuleName: null,
  evidence: [],
  recommendedActions: [],
  auditRowId: null,
  runId: "run-1",
  manifestVersion: null,
};

function model(overrides: Partial<FindingDetailPageModel> = {}): FindingDetailPageModel {
  return {
    runId: "run-1",
    findingIdRouteParam: "finding-1",
    decodedFindingId: "finding-1",
    inspectPayload,
    inspectFailure: null,
    buyerPolishedShell: false,
    linkedManifestHref: null,
    pageTitle: "Public storage exposure",
    findingIsPhi: false,
    runExecutionFootnote: null,
    statedConstraintContext: null,
    nextFindingInReview: null,
    parentArchitectureId: null,
    transparencyTrail: null,
    ...overrides,
  };
}

describe("FindingDetailPageView SecureNow path inspect", () => {
  afterEach(() => {
    productLineState.current = "security";
  });

  it("renders path inspect on the security product line", () => {
    productLineState.current = "security";

    render(<FindingDetailPageView model={model()} />);

    expect(screen.getByTestId("security-evidence-path-inspect-panel")).toBeInTheDocument();
  });

  it("hides path inspect on the architecture product line", () => {
    productLineState.current = "architecture";

    render(<FindingDetailPageView model={model()} />);

    expect(screen.queryByTestId("security-evidence-path-inspect-panel")).not.toBeInTheDocument();
  });
});
