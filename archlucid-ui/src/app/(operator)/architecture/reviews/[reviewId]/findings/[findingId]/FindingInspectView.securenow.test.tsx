import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const productLineState = vi.hoisted(() => ({
  current: "security" as "architecture" | "security",
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: productLineState.current }),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => false,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("./FindingInspectGovernanceStickinessPanel", () => ({
  FindingInspectGovernanceStickinessPanel: () => <div data-testid="stickiness-panel-mock" />,
}));

vi.mock("./FindingInspectItsmWorkflowPanel", () => ({
  FindingInspectItsmWorkflowPanel: () => <div data-testid="itsm-panel-mock" />,
}));

vi.mock("./FindingInspectFindingBody", () => ({
  FindingInspectFindingBody: () => <div data-testid="finding-body-mock" />,
}));

vi.mock("./_sections/FindingInspectNextFindingEvidenceFooterClient", () => ({
  FindingInspectNextFindingEvidenceFooterClient: () => null,
}));

vi.mock("@/components/security/SecurityEvidencePathInspectPanel", () => ({
  SecurityEvidencePathInspectPanel: () => <section data-testid="security-evidence-path-inspect-panel" />,
}));

import { FindingInspectView } from "./FindingInspectView";

const basePayload = {
  runId: "run-1",
  findingId: "finding-1",
  typedPayload: { title: "Storage account is publicly reachable" },
  decisionRuleId: null,
  decisionRuleName: null,
  evidence: [],
  recommendedActions: [],
  auditRowId: null,
  manifestVersion: null,
};

describe("FindingInspectView SecureNow path inspect", () => {
  afterEach(() => {
    productLineState.current = "security";
  });

  it("renders path inspect on the security product line", () => {
    productLineState.current = "security";

    render(
      <FindingInspectView
        runId="run-1"
        decodedFindingId="finding-1"
        payload={basePayload}
        failure={null}
      />,
    );

    expect(screen.getByTestId("security-evidence-path-inspect-panel")).toBeInTheDocument();
  });

  it("hides path inspect on the architecture product line", () => {
    productLineState.current = "architecture";

    render(
      <FindingInspectView
        runId="run-1"
        decodedFindingId="finding-1"
        payload={basePayload}
        failure={null}
      />,
    );

    expect(screen.queryByTestId("security-evidence-path-inspect-panel")).not.toBeInTheDocument();
  });
});
