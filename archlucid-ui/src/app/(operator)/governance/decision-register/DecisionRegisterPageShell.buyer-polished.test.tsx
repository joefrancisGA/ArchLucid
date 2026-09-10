import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DecisionRegisterPageShell } from "./DecisionRegisterPageShell";
import type { DecisionRegisterPageShellProps } from "./DecisionRegisterPageShell";
import {
  DECISION_REGISTER_PAGE_SUBTITLE,
  DECISION_REGISTER_PAGE_SUBTITLE_BUYER,
} from "./decision-register-copy";
import { DECISION_REGISTER_CLAIM_DISCIPLINE, DECISION_REGISTER_FOLLOW_UPS_TITLE } from "@/lib/decision-register-evidence-copy";
import {
  GOVERNANCE_DECISION_REGISTER_BUYER_START_HERE_HELPER,
  GOVERNANCE_DECISION_REGISTER_PAGE_LEAD,
  GOVERNANCE_DECISION_REGISTER_PRIMARY_CONTENT_ID,
  GOVERNANCE_DECISION_REGISTER_SKIP_LINK_LABEL,
} from "@/lib/governance-decision-register-page-copy";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
    isOperatorExperienceFullShellEnv: () => false,
  };
});

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("@/components/LayerHeader", () => ({
  LayerHeader: () => null,
}));

vi.mock("@/components/governance/GovernanceJobRouterStrip", () => ({
  GovernanceJobRouterStrip: () => <div data-testid="governance-job-router-strip" />,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("./DecisionRegisterExportButton", () => ({
  DecisionRegisterExportButton: () => null,
}));

vi.mock("./DecisionRegisterViewSwitcher", () => ({
  DecisionRegisterViewSwitcher: () => null,
}));

vi.mock("./DecisionRegisterSummaryRow", () => ({
  DecisionRegisterSummaryRow: () => <div data-testid="decision-register-summary-row" />,
}));

vi.mock("./DecisionRegisterPickReviewBeforeFilteringStrip", () => ({
  DecisionRegisterPickReviewBeforeFilteringStrip: () => (
    <div data-testid="decision-register-pick-review-strip" />
  ),
}));

vi.mock("./DecisionRegisterViewEmptyShell", () => ({
  DecisionRegisterViewEmptyShell: ({ children }: { readonly children: React.ReactNode }) => (
    <div data-testid="decision-register-view-empty-shell">{children}</div>
  ),
}));

vi.mock("./DecisionRegisterWorkspaceActiveApprovalStrip", () => ({
  DecisionRegisterWorkspaceActiveApprovalStrip: () => null,
}));

vi.mock("./DecisionRegisterNextReviewFooterClient", () => ({
  DecisionRegisterNextReviewFooterClient: () => <div data-testid="decision-register-next-review-footer" />,
}));

function buildProps(overrides: Partial<DecisionRegisterPageShellProps> = {}): DecisionRegisterPageShellProps {
  return {
    buyerPolishedShell: true,
    currentSearch: "",
    scopedRunId: "",
    scopedRunFilterActive: false,
    datePreset: null,
    viewMode: "cards",
    category: "",
    setCategory: vi.fn(),
    recordedAfter: "",
    setRecordedAfter: vi.fn(),
    recordedBefore: "",
    setRecordedBefore: vi.fn(),
    minConfidence: "",
    setMinConfidence: vi.fn(),
    maxConfidence: "",
    setMaxConfidence: vi.fn(),
    confidenceBasis: "",
    setConfidenceBasis: vi.fn(),
    retryLoad: vi.fn(),
    summary: {
      recordedDecisions: 0,
      recentDecisions: 0,
      highConfidenceDecisions: 0,
      decisionsNeedingReview: 0,
      lastRecordedDecisionLabel: "None yet",
    },
    continueLastDecision: null,
    collapseAdvancedFilters: false,
    loading: false,
    hasWorkspaceDecisions: false,
    hasFilteredResults: false,
    filtersExcludeMatches: false,
    filteredDecisions: [],
    loadError: null,
    decisionRegisterFilterChecklistSteps: [],
    decisionRegisterFilterChecklistEmphasizedStepId: null,
    onPickReviewForFiltering: vi.fn(),
    resetFilters: vi.fn(),
    clearCustomDatePreset: vi.fn(),
    ...overrides,
  };
}

describe("DecisionRegisterPageShell buyer-polished shell (GDO)", () => {
  it("renders skip link, first-viewport intro, and orientation after the register body", () => {
    render(<DecisionRegisterPageShell {...buildProps()} />);

    expect(screen.getByRole("link", { name: GOVERNANCE_DECISION_REGISTER_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_DECISION_REGISTER_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("decision-register-claim-discipline")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: DECISION_REGISTER_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("governance-decision-register-primary-content")).toBeInTheDocument();
    expect(screen.getByTestId("governance-decision-register-first-viewport")).toBeInTheDocument();
    expect(screen.getByTestId("governance-decision-register-intro")).toHaveTextContent(
      GOVERNANCE_DECISION_REGISTER_PAGE_LEAD,
    );
    expect(screen.getByTestId("governance-decision-register-buyer-start-here-helper")).toHaveTextContent(
      GOVERNANCE_DECISION_REGISTER_BUYER_START_HERE_HELPER,
    );
    expect(screen.queryByTestId("decision-register-findings-vocabulary")).not.toBeInTheDocument();

    const primary = screen.getByTestId("governance-decision-register-primary-content");
    const orientation = screen.getByTestId("decision-register-orientation-bottom");
    const emptyState = screen.getByTestId("decision-register-empty-state");

    expect(primary).toContainElement(orientation);
    expect(primary).toContainElement(emptyState);
    expect(emptyState.compareDocumentPosition(orientation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("uses buyer subtitle in the header without duplicate operator subtitle", () => {
    render(<DecisionRegisterPageShell {...buildProps()} />);

    expect(screen.getByText(DECISION_REGISTER_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(DECISION_REGISTER_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId("decision-register-claim-discipline").textContent).toContain(
      DECISION_REGISTER_CLAIM_DISCIPLINE.slice(0, 40),
    );
  });
});
