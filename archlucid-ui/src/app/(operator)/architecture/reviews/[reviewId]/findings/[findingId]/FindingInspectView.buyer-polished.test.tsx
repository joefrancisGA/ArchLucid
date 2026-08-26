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

import { EVIDENCE_TRACE_CLAIM_DISCIPLINE } from "@/lib/evidence-trace-evidence-copy";

import { FindingInspectView } from "./FindingInspectView";
import {
  EVIDENCE_TRACE_PAGE_SUBTITLE_BUYER,
} from "./evidence-trace-page-copy";

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

describe("FindingInspectView buyer-polished shell", () => {
  it("renders breadcrumb, buyer subtitle, claim strip, and hides contextual help", () => {
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

    expect(screen.getByTestId("finding-eru-claim-discipline").textContent).toContain(
      EVIDENCE_TRACE_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByText(EVIDENCE_TRACE_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("evidence-trace-orientation")).toBeNull();
    expect(screen.getByTestId("evidence-trace-back-to-finding")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-1/findings/finding-1",
    );
  });
});
