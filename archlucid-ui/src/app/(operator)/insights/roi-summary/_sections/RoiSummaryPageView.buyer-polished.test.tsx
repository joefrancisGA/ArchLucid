import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { ROI_SUMMARY_PAGE_SUBTITLE } from "@/lib/roi-summary-sponsor-presentation";
import {
  ROI_SUMMARY_CLAIM_DISCIPLINE_HEADING,
  ROI_SUMMARY_FOLLOW_UPS_TITLE,
} from "@/lib/roi-summary-evidence-copy";
import {
  ROI_SUMMARY_PAGE_TITLE,
  ROI_SUMMARY_PRIMARY_CONTENT_ID,
  ROI_SUMMARY_SKIP_LINK_LABEL,
} from "@/lib/roi-summary-page-copy";
import { SPONSOR_REPORT_PAGE_TITLE } from "@/lib/sponsor-report-navigation";
import { OPERATOR_NAV_GROUP_LABELS } from "@/lib/i18n";
import type { PilotValueReportJson } from "@/types/pilot-value-report";

import { RoiSummaryPageView } from "./RoiSummaryPageView";
import type { RoiSummaryPageViewModel } from "./roi-summary-page-view-model";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/LayerHeader", () => ({
  LayerHeader: () => <div data-testid="layer-header" />,
}));

vi.mock("@/components/usability/ValueReportOutcomesNav", () => ({
  ValueReportOutcomesNav: () => <nav data-testid="value-report-outcomes-nav" />,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/RoiSponsorExportVocabularyRail", () => ({
  RoiSponsorExportVocabularyRail: () => <div data-testid="roi-sponsor-export-vocabulary" />,
}));

vi.mock("@/components/ScorecardRoiVocabularyRail", () => ({
  ScorecardRoiVocabularyRail: () => <div data-testid="scorecard-roi-vocabulary" />,
}));

vi.mock("@/components/BaselineRoiVocabularyRail", () => ({
  BaselineRoiVocabularyRail: () => <div data-testid="baseline-roi-vocabulary" />,
}));

vi.mock("@/hooks/use-roi-loaded-hourly-usd", () => ({
  useRoiLoadedHourlyUsd: () => ({
    hourlyUsd: 150,
    mounted: true,
    isDefaultRate: true,
    setHourlyUsd: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}

    unobserve(): void {}

    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
});

function emptyReport(): PilotValueReportJson {
  return {
    tenantId: "tenant-1",
    fromUtc: "2026-06-08T00:00:00.000Z",
    toUtc: "2026-07-08T00:00:00.000Z",
    totalRunsCommitted: 0,
    runDetailsTruncated: false,
    runDetailCap: 50,
    totalFindings: 0,
    findingsBySeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
    totalRecommendationsProduced: 0,
    averagePipelineCompletionSeconds: null,
    governanceApprovals: 0,
    governanceRejections: 0,
    policyPackAssignments: 0,
    comparisonOrDriftDetections: 0,
    uniqueAgentTypes: [],
    committedRunsTimeline: [],
    governancePendingApprovalsNow: 0,
    auditExportTruncated: false,
  };
}

function buildModel(overrides: Partial<RoiSummaryPageViewModel> = {}): RoiSummaryPageViewModel {
  const report = emptyReport();

  return {
    demo: false,
    isAdmin: false,
    load: vi.fn(async () => undefined),
    state: {
      status: "ready",
      rolling30: { report, blocks: { count: 0, exact: true } },
      pilotToDate: { report, blocks: { count: 0, exact: true } },
    },
    ...overrides,
  };
}

describe("RoiSummaryPageView buyer-polished shell", () => {
  it("renders skip link, breadcrumb, orientation after hero, and hides vocabulary rails", () => {
    render(<RoiSummaryPageView model={buildModel()} />);

    const skipLink = screen.getByRole("link", { name: ROI_SUMMARY_SKIP_LINK_LABEL });
    expect(skipLink).toHaveAttribute("href", `#${ROI_SUMMARY_PRIMARY_CONTENT_ID}`);

    const breadcrumb = screen.getByTestId("roi-summary-breadcrumb");
    expect(breadcrumb).toHaveTextContent(OPERATOR_NAV_GROUP_LABELS.analysis);
    expect(breadcrumb).toHaveTextContent(SPONSOR_REPORT_PAGE_TITLE);
    expect(breadcrumb).toHaveTextContent(ROI_SUMMARY_PAGE_TITLE);

    expect(screen.getByRole("heading", { level: 1, name: ROI_SUMMARY_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(ROI_SUMMARY_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Related value reports" })).not.toBeInTheDocument();

    expect(
      screen.getByRole("heading", { level: 2, name: ROI_SUMMARY_CLAIM_DISCIPLINE_HEADING }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: ROI_SUMMARY_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    expect(screen.queryByTestId("roi-sponsor-export-vocabulary")).toBeNull();
    expect(screen.queryByTestId("scorecard-roi-vocabulary")).toBeNull();
    expect(screen.queryByTestId("baseline-roi-vocabulary")).toBeNull();
    expect(screen.queryByTestId("layer-header")).toBeNull();

    const primaryContent = screen.getByTestId("roi-summary-primary-content");
    const orientation = screen.getByTestId("roi-summary-orientation-top");
    const hero = screen.getByTestId("roi-summary-hero-strip");

    expect(primaryContent).toContainElement(orientation);
    expect(hero.compareDocumentPosition(orientation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
