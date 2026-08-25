import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FindingInspectView } from "./FindingInspectView";

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

const basePayload = {
  runId: "run-1",
  findingId: "finding-1",
  typedPayload: { title: "Sample finding title" },
  decisionRuleId: null,
  decisionRuleName: null,
  evidence: [],
  recommendedActions: [],
  auditRowId: null,
  manifestVersion: null,
};

describe("FindingInspectView review terminology", () => {
  it("uses review vocabulary with runId bridge when URL runId mismatches payload", () => {
    render(
      <FindingInspectView
        runId="url-review-id"
        decodedFindingId="finding-1"
        payload={{
          ...basePayload,
          runId: "payload-review-id",
        }}
        failure={null}
      />,
    );

    expect(screen.getByText(/belongs to review/i)).toBeInTheDocument();
    expect(screen.getByText("payload-review-id")).toBeInTheDocument();
    expect(screen.getByText(/Review ID \(API field: runId\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/belongs to run/i)).toBeNull();
  });
});

describe("FindingInspectView ERU Evidence pass (TB-1826–TB-1829)", () => {
  it("uses finding-first H1, back-to-finding, orientation strip, and no footer self-link", () => {
    render(
      <FindingInspectView
        runId="run-1"
        decodedFindingId="finding-1"
        payload={{
          ...basePayload,
          decisionRuleName: "Sample finding title",
        }}
        failure={null}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Sample finding title" })).toBeInTheDocument();
    expect(screen.getByTestId("evidence-trace-back-to-finding")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-1/findings/finding-1",
    );
    expect(screen.queryByTestId("evidence-trace-orientation")).toBeNull(); // TB-2092
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();

    const footer = screen.getByTestId("operator-evidence-limits-footer");
    expect(footer.querySelector('a[href*="evidence-trace"]')).toBeNull();

    expect(screen.getByRole("heading", { level: 2, name: "Act on this finding" })).toBeInTheDocument();
  });
});
