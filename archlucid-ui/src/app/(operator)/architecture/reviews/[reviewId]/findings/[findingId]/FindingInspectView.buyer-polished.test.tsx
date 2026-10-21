import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { expectWhereToGoNextFollowUpLinks } from "@/lib/claim-discipline-test-helpers";
import { buildEvidenceTraceSources } from "@/lib/evidence-trace-evidence-copy";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/lib/resolve-production-eval-chrome-from-storage", () => ({
  resolveProductionEvalChromeFromStorage: (): boolean => true,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-1/findings/finding-1/evidence-trace",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

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
  EVIDENCE_TRACE_FIRST_VIEWPORT_ID,
  EVIDENCE_TRACE_PAGE_SUBTITLE_BUYER,
  EVIDENCE_TRACE_PRIMARY_CONTENT_ID,
  EVIDENCE_TRACE_SKIP_LINK_LABEL,
  EVIDENCE_TRACE_SKIP_TARGET_ID,
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

describe("FindingInspectView buyer-polished shell (ERU)", () => {
  it("renders skip link, first-viewport band, orientation above evidence body, claim discipline, and Sources links", () => {
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

    expect(screen.getByRole("link", { name: EVIDENCE_TRACE_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${EVIDENCE_TRACE_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId(EVIDENCE_TRACE_PRIMARY_CONTENT_ID)).toHaveAttribute(
      "id",
      EVIDENCE_TRACE_PRIMARY_CONTENT_ID,
    );
    expect(screen.getByText(EVIDENCE_TRACE_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByTestId("finding-eru-claim-discipline").textContent).toContain(
      EVIDENCE_TRACE_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.getByTestId("evidence-trace-back-to-finding")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-1/findings/finding-1",
    );

    const primaryContent = screen.getByTestId(EVIDENCE_TRACE_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(EVIDENCE_TRACE_FIRST_VIEWPORT_ID);
    const pageHeader = screen.getByTestId("evidence-trace-workspace-header");
    const orientationTop = screen.getByTestId("evidence-trace-orientation-top");
    const evidenceBody = screen.getByTestId("finding-body-mock");
    const sourcesSection = screen.getByTestId("finding-eru-sources");

    expect(primaryContent).toContainElement(pageHeader);
    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).not.toContainElement(pageHeader);
    expect(firstViewport).toContainElement(orientationTop);
    expect(firstViewport).toContainElement(evidenceBody);
    expect(orientationTop).toContainElement(sourcesSection);
    expect(orientationTop.compareDocumentPosition(evidenceBody) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expectWhereToGoNextFollowUpLinks(
      within(sourcesSection),
      buildEvidenceTraceSources("run-1", "finding-1"),
      "/architecture/reviews/run-1/findings/finding-1/evidence-trace",
    );
  });
});
