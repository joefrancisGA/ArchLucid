import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import type { UseValueReportPageModel } from "./use-value-report-page";
import { ValueReportPageView } from "./ValueReportPageView";
import { BUYER_VALUE_REPORT_OUTCOME_LEAD, BUYER_VALUE_REPORT_PAGE_SUBTITLE } from "@/lib/buyer/buyer-polish-copy";
import { LAYER_PAGE_GUIDANCE } from "@/lib/layer-guidance";

vi.mock("@/components/LayerHeader", () => ({
  LayerHeader: () => <div data-testid="layer-header" />,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...mod,
    isBuyerPolishedOperatorShellEnv: vi.fn(() => false),
    isNextPublicDemoMode: vi.fn(() => false),
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/insights/executive-summary",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
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

function buildModel(overrides?: Partial<UseValueReportPageModel>): UseValueReportPageModel {
  return {
    boardBusy: false,
    busy: false,
    canDownload: false,
    canMutate: true,
    error: null,
    fromUtc: "2026-01-01",
    hasReportData: false,
    onBoardPack: vi.fn(async () => undefined),
    onGenerate: vi.fn(async () => undefined),
    onRefreshPreview: vi.fn(async () => undefined),
    previewBusy: false,
    previewMetrics: null,
    setFromUtc: vi.fn(),
    setToUtc: vi.fn(),
    toUtc: "2026-06-01",
    ...overrides,
  };
}

describe("ValueReportPageView report problem (TB-791)", () => {
  it("renders Report problem on executive value report hard failure", () => {
    render(
      <ValueReportPageView
        model={buildModel({
          error: {
            correlationId: "corr-value-report-503",
            message: "Sponsor report preview could not be loaded.",
            problem: { title: "Service unavailable", detail: "Try again later." },
          },
        })}
      />,
    );

    expect(screen.getByTestId("report-problem-trigger")).toBeInTheDocument();
  });
});

describe("ValueReportPageView buyer-polished chrome (TB-1437)", () => {
  it("shows one page hero — no LayerHeader guidance above the export panel", async () => {
    const { isBuyerPolishedOperatorShellEnv } = await import("@/lib/demo-ui-env");
    vi.mocked(isBuyerPolishedOperatorShellEnv).mockReturnValue(true);

    render(<ValueReportPageView model={buildModel()} />);

    expect(screen.getAllByText(BUYER_VALUE_REPORT_PAGE_SUBTITLE)).toHaveLength(1);
    expect(screen.getAllByText(BUYER_VALUE_REPORT_OUTCOME_LEAD)).toHaveLength(1);
    expect(screen.queryByText(LAYER_PAGE_GUIDANCE["value-report"].headline)).not.toBeInTheDocument();
    expect(screen.queryByTestId("layer-header")).not.toBeInTheDocument();
    expect(screen.getByTestId("value-report-export-panel")).toBeInTheDocument();
  });
});

describe("ValueReportPageView buyer-polished chrome (TB-1964)", () => {
  it("omits page subtitle and outcome lead when LayerHeader owns the lead in enterprise shell", async () => {
    const { isBuyerPolishedOperatorShellEnv } = await import("@/lib/demo-ui-env");
    vi.mocked(isBuyerPolishedOperatorShellEnv).mockReturnValue(false);

    render(<ValueReportPageView model={buildModel()} />);

    expect(screen.getByTestId("layer-header")).toBeInTheDocument();
    expect(screen.queryByTestId("value-report-sources")).toBeNull(); // TB-2092
    expect(screen.queryByTestId("value-report-claim-discipline")).toBeNull(); // TB-2092
    expect(screen.queryByText(BUYER_VALUE_REPORT_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.queryByText(BUYER_VALUE_REPORT_OUTCOME_LEAD)).not.toBeInTheDocument();
  });
});
