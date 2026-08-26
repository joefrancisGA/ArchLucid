import { render, screen } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UsePilotScorecardPageModel } from "@/app/(operator)/insights/architecture-scorecard/_sections/use-pilot-scorecard-page";
import {
  ARCHITECTURE_SCORECARD_CLAIM_DISCIPLINE_HEADING,
  ARCHITECTURE_SCORECARD_FOLLOW_UPS_TITLE,
} from "@/lib/architecture/architecture-scorecard-evidence-copy";
import {
  ARCHITECTURE_SCORECARD_PRIMARY_CONTENT_ID,
  ARCHITECTURE_SCORECARD_SKIP_LINK_LABEL,
} from "@/lib/architecture/architecture-scorecard-page-copy";
import {
  REVIEW_SCORECARD_PAGE_SUBTITLE,
  REVIEW_SCORECARD_PAGE_TITLE,
} from "@/lib/pilot-scorecard-present";
import type { PilotScorecardJson } from "@/types/pilot-scorecard";

import { PilotScorecardPageView } from "./PilotScorecardPageView";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    useRouter: () => ({
      replace: vi.fn(),
      push: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    }),
    useSearchParams: vi.fn(() => new URLSearchParams("runId=run-scorecard-test")),
  };
});

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/usability/ValueReportOutcomesNav", () => ({
  ValueReportOutcomesNav: () => <nav data-testid="value-report-outcomes-nav" />,
}));

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

vi.mock("@/components/ScorecardRoiVocabularyRail", () => ({
  ScorecardRoiVocabularyRail: () => <div data-testid="scorecard-roi-vocabulary" />,
}));

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ runId: "", setRunId: vi.fn() }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: () => <div data-testid="ask-run-id-picker" />,
}));

vi.mock("./ScorecardNextReviewFooterClient", () => ({
  ScorecardNextReviewFooterClient: () => <div data-testid="scorecard-next-review-footer-stub" />,
}));

const mockUseSearchParams = vi.mocked(useSearchParams);

const scorecardData: PilotScorecardJson = {
  tenantId: "00000000-0000-0000-0000-000000000001",
  totalRunsCommitted: 2,
  totalManifestsCreated: 1,
  totalFindingsResolved: 4,
  averageTimeToManifestMinutes: 45,
  totalAuditEventsGenerated: 8,
  totalGovernanceApprovalsCompleted: 1,
  firstCommitUtc: "2026-01-01T00:00:00.000Z",
  daysSinceFirstCommit: 20,
  metricSources: { totalRunsCommitted: "measured" },
  baselines: null,
  roiEstimate: null,
};

function buildModel(overrides: Partial<UsePilotScorecardPageModel> = {}): UsePilotScorecardPageModel {
  return {
    assumptionsComplete: false,
    assumptionsDirty: false,
    canExecute: true,
    canSaveAssumptions: false,
    data: scorecardData,
    error: null,
    fieldErrors: { hours: null, reviews: null, rate: null },
    hours: "",
    livePreview: null,
    metricsAsOfUtc: null,
    onSaveBaselines: vi.fn(async () => undefined),
    rate: "",
    reviews: "",
    saving: false,
    setHours: vi.fn(),
    setRate: vi.fn(),
    setReviews: vi.fn(),
    resolvedAnnualSavingsLabel: null,
    resolvedQuarterlySavingsLabel: null,
    resolvedStatusQuoCostLabel: null,
    ...overrides,
  };
}

describe("PilotScorecardPageView buyer-polished shell", () => {
  beforeEach(() => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("runId=run-scorecard-test"));
  });

  it("renders skip link, orientation above summary row, and hides vocabulary rail", () => {
    render(<PilotScorecardPageView model={buildModel()} />);

    const skipLink = screen.getByRole("link", { name: ARCHITECTURE_SCORECARD_SKIP_LINK_LABEL });
    expect(skipLink).toHaveAttribute("href", `#${ARCHITECTURE_SCORECARD_PRIMARY_CONTENT_ID}`);

    expect(screen.getByRole("heading", { level: 1, name: REVIEW_SCORECARD_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(REVIEW_SCORECARD_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Related value reports" })).not.toBeInTheDocument();

    expect(
      screen.getByRole("heading", { level: 2, name: ARCHITECTURE_SCORECARD_CLAIM_DISCIPLINE_HEADING }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: ARCHITECTURE_SCORECARD_FOLLOW_UPS_TITLE }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sources" })).toBeNull();
    expect(screen.getByTestId("architecture-scorecard-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("scorecard-roi-vocabulary")).toBeNull();

    const primaryContent = screen.getByTestId("architecture-scorecard-primary-content");
    const orientation = screen.getByTestId("architecture-scorecard-orientation-top");
    const summaryRow = screen.getByTestId("review-scorecard-summary-row");

    expect(primaryContent).toContainElement(orientation);
    expect(orientation.compareDocumentPosition(summaryRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
