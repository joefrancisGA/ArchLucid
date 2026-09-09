import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import {
  REVIEW_DETAIL_FIRST_VIEWPORT_ID,
  REVIEW_DETAIL_PRIMARY_CONTENT_ID,
  REVIEW_DETAIL_SKIP_LINK_LABEL,
  REVIEW_DETAIL_SKIP_TARGET_ID,
} from "@/lib/review-detail-page-copy";
import {
  REVIEW_WORKSPACE_CLAIM_DISCIPLINE,
  buildReviewWorkspaceSources,
} from "@/lib/review-workspace-evidence-copy";
import { REVIEW_DETAIL_WORKSPACE_TABS_TEST_ID } from "@/components/reviews/ReviewWorkspaceTabStrip";
import { buildRunDetailPresentation } from "./run-detail-page-presentation";
import {
  resolveRunDetailPageViewChrome,
  RunDetailPageViewShell,
} from "./RunDetailPageViewShell";
import type { RunDetailPageModel } from "./run-detail-page-model";

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-1",
  useSearchParams: () => new URLSearchParams("reviewTab=overview"),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
    isOperatorExperienceFullShellEnv: (): boolean => false,
  };
});

vi.mock("./run-detail-page-view-deferred-chunks", () => ({
  RunDetailCtoDemoReviewRouteGuardDeferred: () => null,
  HelpPageSituationRegistrarDeferred: () => null,
  ReviewGenerationCreatedNoticeDeferred: () => null,
  RunDetailDemoMarketingChromeDeferred: () => null,
  RunDetailWorkspaceHeaderDeferred: () => (
    <div data-testid="run-detail-workspace-header">
      <h1>Claims intake modernization</h1>
      <div data-testid="review-detail-claim-discipline">{REVIEW_WORKSPACE_CLAIM_DISCIPLINE}</div>
    </div>
  ),
  RunDetailSampleReviewPackageSummaryDeferred: () => null,
  RunDetailGovernanceAlertsDeferred: () => null,
  RunDetailOutcomeCardsDeferred: () => null,
  RunDetailSectionNavDeferred: () => null,
  RunDetailGovernanceCtaDeferred: () => null,
  RunDetailStalledReviewGuidanceCalloutDeferred: () => null,
  RunDetailCommitBlockingFindingsBannerDeferred: () => null,
  RunDetailBuyerModeFallbackBannerDeferred: () => null,
  RunDetailBuyerPilotConversionSectionDeferred: () => null,
  RunDetailFirstWeekRouteGuidanceDeferred: () => <div data-testid="first-week-route-guidance" />,
  OperatorWelcomeOnboardingDeferred: () => null,
}));

vi.mock("@/components/architecture/WorkingNestedArchitectureIdentityChromeMount", () => ({
  WorkingNestedArchitectureIdentityChromeMount: () => null,
}));

vi.mock("@/components/reviews/WorkingUnlinkedReviewHonestyBanner", () => ({
  WorkingUnlinkedReviewHonestyBanner: () => null,
}));

vi.mock("@/components/reviews/RunDetailDeferredScopeNoticeClient", () => ({
  RunDetailDeferredScopeNoticeClient: () => null,
}));

vi.mock("@/components/governance/GovernanceModePresentationGate", () => ({
  GovernanceModePresentationGate: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/ArchitectureIntelligenceReviewToolStrip", () => ({
  ArchitectureIntelligenceReviewToolStrip: () => null,
}));

vi.mock("@/components/SignedRecordsReviewDetailVocabularyRail", () => ({
  SignedRecordsReviewDetailVocabularyRail: () => (
    <div data-testid="signed-records-review-detail-vocabulary-rail" />
  ),
}));

vi.mock("@/components/operator/OperatorRelatedSurfacesDisclosure", () => ({
  OperatorRelatedSurfacesDisclosure: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("./RunDetailNextReviewFooterClient", () => ({
  RunDetailNextReviewFooterClient: () => null,
}));

vi.mock("./RunDetailPageViewCreateHome", () => ({
  RunDetailPageViewCreateHome: () => <div data-testid="run-detail-create-home" />,
}));

vi.mock("./RunDetailPageViewCommitted", () => ({
  RunDetailPageViewCommitted: () => null,
}));

vi.mock("./RunDetailTabbedWorkspace", () => ({
  RunDetailTabbedWorkspace: () => <div data-testid={REVIEW_DETAIL_WORKSPACE_TABS_TEST_ID} />,
}));

function model(overrides: Partial<{ buyerPolishedArtifactTable: boolean; manifestId: string | null }> = {}): RunDetailPageModel {
  return {
    routeRunId: "run-1",
    resolvedDetail: {
      run: {
        runId: "run-1",
        createdUtc: "2026-08-01T12:00:00Z",
        completedUtc: "2026-08-01T12:30:00Z",
        description: "Claims intake modernization",
        operatorGovernanceDecision: null,
        architectureId: null,
      },
      results: [],
      findingCoverageSummary: null,
    },
    runDetailTraceId: null,
    buyerPolishedArtifactTable: overrides.buyerPolishedArtifactTable ?? true,
    usedStaticDemoRun: false,
    manifestId: overrides.manifestId ?? "manifest-1",
    headline: "Claims intake modernization",
    createdLabel: "Aug 1, 2026",
    goldenManifestJsonForExport: null,
    progressForPipelineUi: { runId: "run-1", description: "Claims intake modernization" },
    showProgressTracker: false,
    pipelineDiagnosticContext: null,
    manifestSummary: null,
    manifestSummaryForUi: null,
    manifestSummaryFailure: null,
    manifestSummaryMalformed: null,
    artifacts: [],
    artifactsFailure: null,
    artifactsMalformed: null,
    explanationSummary: null,
    explanationFailure: null,
    runDetailNavSections: [],
    findingCountDisplay: 0,
    warningCountDisplay: 0,
    showPilotScorecardPackageCta: false,
    governanceGateLabel: null,
    careerExportEligibleFindingCount: 0,
    adrGeneratorInput: { runId: "run-1" },
  } as unknown as RunDetailPageModel;
}

describe("RunDetailPageViewShell buyer-polished shell (RRE)", () => {
  it("renders skip link, first-viewport band, orientation above workspace tabs, claim discipline, and Sources links", async () => {
    const pageModel = model();
    const presentation = await buildRunDetailPresentation(pageModel, false);
    const chrome = resolveRunDetailPageViewChrome(pageModel, presentation);

    render(<RunDetailPageViewShell model={pageModel} presentation={presentation} chrome={chrome} />);

    expect(screen.getByRole("link", { name: REVIEW_DETAIL_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${REVIEW_DETAIL_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId(REVIEW_DETAIL_PRIMARY_CONTENT_ID)).toHaveAttribute(
      "id",
      REVIEW_DETAIL_PRIMARY_CONTENT_ID,
    );
    expect(screen.getByTestId("review-detail-claim-discipline").textContent).toContain(
      REVIEW_WORKSPACE_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("signed-records-review-detail-vocabulary-rail")).not.toBeInTheDocument();
    expect(screen.queryByTestId("first-week-route-guidance")).not.toBeInTheDocument();

    const primaryContent = screen.getByTestId(REVIEW_DETAIL_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(REVIEW_DETAIL_FIRST_VIEWPORT_ID);
    const pageHeader = screen.getByTestId("run-detail-workspace-header");
    const orientationTop = screen.getByTestId("review-detail-orientation-top");
    const workspaceTabs = screen.getByTestId(REVIEW_DETAIL_WORKSPACE_TABS_TEST_ID);
    const sourcesSection = screen.getByTestId("review-detail-sources");

    expect(primaryContent).toContainElement(pageHeader);
    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).not.toContainElement(pageHeader);
    expect(firstViewport).toContainElement(orientationTop);
    expect(firstViewport).toContainElement(workspaceTabs);
    expect(orientationTop).toContainElement(sourcesSection);
    expect(orientationTop.compareDocumentPosition(workspaceTabs) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    for (const source of filterWhereToGoNextFollowUpLinks(buildReviewWorkspaceSources("run-1"))) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
