import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArchitectureIntelligencePageClient } from "./ArchitectureIntelligencePageClient";
import {
  ARCHITECTURE_INTELLIGENCE_PAGE_SUBTITLE_BUYER,
  ARCHITECTURE_INTELLIGENCE_PRODUCT_CONTEXT_RETRY_LABEL,
} from "@/lib/architecture/architecture-intelligence-page-copy";
import { ARCHITECTURE_INTELLIGENCE_CLAIM_HEADING } from "@/lib/architecture/architecture-intelligence-page-copy";
import { ARCHITECTURE_INTELLIGENCE_CLAIM_DISCIPLINE } from "@/lib/architecture/architecture-intelligence-evidence-copy";

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

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
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
  };
});

describe("ArchitectureIntelligencePageClient buyer-polished shell", () => {
  beforeEach(() => {
    searchParamsGet.mockImplementation(() => null);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({}),
        text: async () => "",
      })),
    );
  });

  it("renders breadcrumb, claim strip, and buyer subtitle without vocabulary rails", () => {
    render(<ArchitectureIntelligencePageClient />);

    expect(screen.getByTestId("architecture-intelligence-page-title")).toHaveTextContent("Architecture intelligence");
    expect(screen.getByText(ARCHITECTURE_INTELLIGENCE_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByTestId("architecture-intelligence-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-intelligence-claim-discipline")).toBeInTheDocument();
    expect(screen.getByText(ARCHITECTURE_INTELLIGENCE_CLAIM_HEADING)).toBeInTheDocument();
    expect(screen.getByText(ARCHITECTURE_INTELLIGENCE_CLAIM_DISCIPLINE)).toBeInTheDocument();
    expect(screen.queryByTestId("ask-architecture-intelligence-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-intelligence-evidence-graph-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-capability-boundary")).not.toBeInTheDocument();
  });

  it("renders product-context load failure with retry", async () => {
    searchParamsGet.mockImplementation((key: string) => {
      if (key === "runId") {
        return "dddddddd-dddd-dddd-dddd-dddddddddddd";
      }

      if (key === "from") {
        return "reviews";
      }

      return null;
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = String(input);

        if (url.includes("/product-runs/") && url.includes("/source-context")) {
          return {
            ok: false,
            text: async () => "Unable to load product context",
          };
        }

        return {
          ok: true,
          json: async () => ({}),
          text: async () => "",
        };
      }),
    );

    render(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-product-context-load-failure")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("architecture-intelligence-description")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: ARCHITECTURE_INTELLIGENCE_PRODUCT_CONTEXT_RETRY_LABEL })).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("architecture-intelligence-product-context-load-retry"));
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
