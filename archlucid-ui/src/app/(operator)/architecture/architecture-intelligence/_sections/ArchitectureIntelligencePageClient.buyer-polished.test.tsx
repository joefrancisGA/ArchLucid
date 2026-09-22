import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { ARCHITECTURE_INTELLIGENCE_CLAIM_DISCIPLINE, ARCHITECTURE_INTELLIGENCE_SOURCES } from "@/lib/architecture/architecture-intelligence-evidence-copy";
import {
  ARCHITECTURE_INTELLIGENCE_FIRST_VIEWPORT_TEST_ID,
  ARCHITECTURE_INTELLIGENCE_PAGE_SUBTITLE_BUYER,
  ARCHITECTURE_INTELLIGENCE_PAGE_TITLE,
  ARCHITECTURE_INTELLIGENCE_PRIMARY_CONTENT_ID,
  ARCHITECTURE_INTELLIGENCE_PRODUCT_CONTEXT_RETRY_LABEL,
  ARCHITECTURE_INTELLIGENCE_SKIP_LINK_LABEL,
  ARCHITECTURE_INTELLIGENCE_SKIP_TARGET_ID,
} from "@/lib/architecture/architecture-intelligence-page-copy";

import { ArchitectureIntelligencePageClient } from "./ArchitectureIntelligencePageClient";

function okJsonFetchResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

function errorFetchResponse(status: number, body: string): Response {
  return new Response(body, { status });
}

const searchParamsGet = vi.fn<(key: string) => string | null>(() => null);

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/hooks/use-llm-monthly-budget-execution-gate", () => ({
  useLlmMonthlyBudgetExecutionGate: () => ({
    loading: false,
    status: {
      monthlyBudgetMonitoringActive: true,
      blocksAdditionalLlmExecution: false,
      utcMonth: "2026-08",
      hardCutoffUsdPerUtcMonth: 75,
      effectiveHardCapUsd: 75,
      purchasedCapBumpUsd: 0,
      estimatedUsdPressure: 25,
      assumedNextCallReservationUsd: 0.5,
      hardCapUtilizationFraction: 0.33,
      warnFraction: 0.75,
      remainingBudgetUsd: 50,
    },
    blocksLlmExecution: false,
  }),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal, {
    useSearchParams: () => ({
      get: searchParamsGet,
      getAll: vi.fn(() => []),
      has: vi.fn(() => false),
      toString: vi.fn(() => ""),
      entries: vi.fn(),
      forEach: vi.fn(),
      keys: vi.fn(),
      values: vi.fn(),
      [Symbol.iterator]: vi.fn(),
    }),
  });
});

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ runId: "", activeRunId: "" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: () => <div data-testid="ask-run-id-picker" />,
}));

vi.mock("./ArchitectureIntelligenceNextReviewFooterClient", () => ({
  ArchitectureIntelligenceNextReviewFooterClient: () => (
    <div data-testid="architecture-intelligence-next-review-footer-stub" />
  ),
}));

describe("ArchitectureIntelligencePageClient buyer-polished shell (AIN)", () => {
  beforeEach(() => {
    searchParamsGet.mockImplementation(() => null);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => okJsonFetchResponse({})),
    );
  });

  it("renders skip link, first-viewport band, orientation above intake, and Sources links", () => {
    render(<ArchitectureIntelligencePageClient />);

    expect(screen.getByRole("link", { name: ARCHITECTURE_INTELLIGENCE_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ARCHITECTURE_INTELLIGENCE_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("architecture-intelligence-primary-content")).toHaveAttribute(
      "id",
      ARCHITECTURE_INTELLIGENCE_PRIMARY_CONTENT_ID,
    );
    expect(screen.getByTestId("architecture-intelligence-page-title")).toHaveTextContent(
      ARCHITECTURE_INTELLIGENCE_PAGE_TITLE,
    );
    expect(screen.getByText(ARCHITECTURE_INTELLIGENCE_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-intelligence-page-breadcrumb")).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-intelligence-breadcrumb")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.getByTestId("architecture-intelligence-claim-discipline").textContent).toContain(
      ARCHITECTURE_INTELLIGENCE_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("ask-architecture-intelligence-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-intelligence-evidence-graph-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-capability-boundary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-intelligence-active-run")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Where to go next" })).toBeInTheDocument();

    const primaryContent = screen.getByTestId("architecture-intelligence-primary-content");
    const firstViewport = screen.getByTestId(ARCHITECTURE_INTELLIGENCE_FIRST_VIEWPORT_TEST_ID);
    const orientationTop = screen.getByTestId("architecture-intelligence-orientation-top");
    const pickReviewStrip = screen.getByTestId("architecture-intelligence-pick-review-before-analysis-strip");
    const sourcesSection = screen.getByTestId("architecture-intelligence-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(orientationTop);
    expect(firstViewport).toContainElement(pickReviewStrip);
    expect(orientationTop).toContainElement(sourcesSection);
    expect(orientationTop.compareDocumentPosition(pickReviewStrip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    for (const source of filterWhereToGoNextFollowUpLinks(ARCHITECTURE_INTELLIGENCE_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });

  it("shows intake load failure with retry when deep-linked product context fails", async () => {
    searchParamsGet.mockImplementation((key: string) => {
      if (key === "runId") {
        return "dddddddd-dddd-dddd-dddd-dddddddddddd";
      }

      if (key === "from") {
        return "reviews";
      }

      return null;
    });

    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const url = String(input);

      if (url.includes("/product-runs/") && url.includes("/source-context")) {
        return errorFetchResponse(503, "Unable to load product context");
      }

      return okJsonFetchResponse({});
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-product-context-load-failure")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("architecture-intelligence-description")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: ARCHITECTURE_INTELLIGENCE_PRODUCT_CONTEXT_RETRY_LABEL }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("architecture-intelligence-product-context-load-retry"));

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("clears stale error alert after successful product context retry", async () => {
    searchParamsGet.mockImplementation((key: string) => {
      if (key === "runId") {
        return "dddddddd-dddd-dddd-dddd-dddddddddddd";
      }

      if (key === "from") {
        return "reviews";
      }

      return null;
    });

    let sourceContextAttempt = 0;

    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const url = String(input);

      if (url.includes("/product-runs/") && url.includes("/source-context")) {
        sourceContextAttempt += 1;

        if (sourceContextAttempt === 1) {
          return errorFetchResponse(503, "Unable to load product context");
        }

        return okJsonFetchResponse({
          runId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
          sourceTexts: [
            {
              fileName: "architecture-description.txt",
              contentType: "text/plain",
              content: "Hydrated after retry.",
            },
          ],
        });
      }

      return okJsonFetchResponse({});
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-product-context-load-failure")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("architecture-intelligence-product-context-load-retry"));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue("Hydrated after retry.");
    });

    expect(screen.queryByTestId("architecture-intelligence-product-context-load-failure")).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-intelligence-error")).not.toBeInTheDocument();
    expect(screen.getByTestId("architecture-intelligence-inbound-context")).toHaveTextContent(
      "Loaded product intake from this review",
    );
  });
});
