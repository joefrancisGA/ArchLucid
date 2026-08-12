import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { LAYER_PAGE_GUIDANCE } from "@/lib/layer-guidance";
import { ROI_SUMMARY_PAGE_SUBTITLE } from "@/lib/roi-summary-sponsor-presentation";
import type { PilotValueReportJson } from "@/types/pilot-value-report";

import { RoiSummaryPageView } from "./RoiSummaryPageView";
import type { RoiSummaryPageViewModel } from "./roi-summary-page-view-model";

vi.mock("@/components/LayerHeader", () => ({
  LayerHeader: () => <div data-testid="layer-header" />,
}));

vi.mock("@/components/usability/ValueReportOutcomesNav", () => ({
  ValueReportOutcomesNav: () => <nav data-testid="value-report-outcomes-nav" />,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...mod,
    isBuyerPolishedOperatorShellEnv: vi.fn(() => false),
  };
});

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

describe("RoiSummaryPageView", () => {
  it("mounts contextual help on ready state (TB-1973)", () => {
    render(<RoiSummaryPageView model={buildModel()} />);

    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
  });

  it("zero-state primary CTA uses buyer Start architecture review label (TB-1972)", () => {
    render(<RoiSummaryPageView model={buildModel()} />);

    expect(screen.getByTestId("roi-summary-zero-state")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA })).toHaveAttribute(
      "href",
      "/architecture/reviews/new",
    );
    expect(screen.queryByRole("link", { name: "Start review" })).not.toBeInTheDocument();
  });
});

describe("RoiSummaryPageView buyer-polished chrome (TB-1974)", () => {
  it("shows one page hero — no LayerHeader guidance above the metrics strip", async () => {
    const { isBuyerPolishedOperatorShellEnv } = await import("@/lib/demo-ui-env");
    vi.mocked(isBuyerPolishedOperatorShellEnv).mockReturnValue(true);

    render(<RoiSummaryPageView model={buildModel()} />);

    expect(screen.getAllByText(ROI_SUMMARY_PAGE_SUBTITLE)).toHaveLength(1);
    expect(screen.queryByText(LAYER_PAGE_GUIDANCE["value-report-roi"].headline)).not.toBeInTheDocument();
    expect(screen.queryByTestId("layer-header")).not.toBeInTheDocument();
    expect(screen.getByTestId("roi-summary-hero-strip")).toBeInTheDocument();
  });

  it("omits page subtitle when LayerHeader owns the lead in enterprise shell", async () => {
    const { isBuyerPolishedOperatorShellEnv } = await import("@/lib/demo-ui-env");
    vi.mocked(isBuyerPolishedOperatorShellEnv).mockReturnValue(false);

    render(<RoiSummaryPageView model={buildModel()} />);

    expect(screen.getByTestId("layer-header")).toBeInTheDocument();
    expect(screen.queryByText(ROI_SUMMARY_PAGE_SUBTITLE)).not.toBeInTheDocument();
  });
});
