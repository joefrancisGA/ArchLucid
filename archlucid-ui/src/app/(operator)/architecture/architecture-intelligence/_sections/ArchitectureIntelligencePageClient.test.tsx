import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArchitectureIntelligencePageClient } from "./ArchitectureIntelligencePageClient";

const searchParamsGet = vi.fn<(key: string) => string | null>(() => null);

function stubProductContextFetch(runId: string, content: string): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (method === "GET" && url.includes("/product-runs/") && url.includes("/source-context")) {
        return {
          ok: true,
          json: async () => ({
            runId,
            sourceTexts: [
              {
                fileName: "architecture-description.txt",
                contentType: "text/plain",
                content,
              },
            ],
          }),
          text: async () => "",
        };
      }

      if (method === "POST" && url.includes("/architecture-intelligence/run")) {
        return {
          ok: true,
          json: async () => ({
            runId,
            model: { elements: [] },
            specialistReviews: [
              {
                findings: [
                  {
                    findingId: "finding-from-previous-run",
                    title: "Stale finding from previous review",
                    severity: "High",
                    conclusion: "Should not survive inbound run switch",
                  },
                ],
              },
            ],
            recommendations: [],
            mustNotFailViolations: [],
          }),
          text: async () => "",
        };
      }

      return {
        ok: true,
        json: async () => ({}),
        text: async () => "",
      };
    }),
  );
}

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
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

describe("ArchitectureIntelligencePageClient", () => {
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

  it("renders description input and action buttons", () => {
    render(<ArchitectureIntelligencePageClient />);

    expect(screen.getByTestId("architecture-intelligence-page")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-intelligence-analysis-setup-progress")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-intelligence-analysis-setup-step-review")).toHaveAttribute(
      "data-emphasized",
      "true",
    );
    expect(screen.getByTestId("architecture-intelligence-description")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-intelligence-priorities")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run architecture reasoning" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run golden test" })).toBeInTheDocument();
    expect(document.getElementById("architecture-intelligence-actions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Load golden fixture" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish to findings/advisory" })).toBeInTheDocument();
    expect(screen.getByTestId("architecture-intelligence-publish-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-intelligence-review-tier")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-intelligence-depth-hint")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-intelligence-budget-notice")).toHaveTextContent(
      "Architecture reasoning uses AI budget.",
    );
    expect(screen.queryByTestId("architecture-intelligence-analyze-review-button")).not.toBeInTheDocument();
  });

  it("hydrates architecture description from product run source-context", async () => {
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
            ok: true,
            json: async () => ({
              runId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
              sourceTexts: [
                {
                  fileName: "architecture-description.txt",
                  contentType: "text/plain",
                  content: "Hydrated product architecture description.",
                },
              ],
            }),
            text: async () => "",
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
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Hydrated product architecture description.",
      );
    });

    expect(screen.getByTestId("architecture-intelligence-inbound-context")).toHaveTextContent(
      "Loaded product intake from review",
    );
    expect(screen.getByTestId("architecture-intelligence-analyze-review-button")).toBeInTheDocument();
  });

  it("shows empty-intake notice when deep-linked run has no source texts", async () => {
    searchParamsGet.mockImplementation((key: string) => {
      if (key === "runId") {
        return "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
      }

      return null;
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = String(input);

        if (url.includes("/product-runs/") && url.includes("/source-context")) {
          return {
            ok: true,
            json: async () => ({
              runId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
              sourceTexts: [],
            }),
            text: async () => "",
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
      expect(screen.getByTestId("architecture-intelligence-inbound-context")).toHaveTextContent(
        "no architecture intake",
      );
    });

    expect(screen.getByTestId("architecture-intelligence-inbound-context")).toHaveTextContent(
      "paste a description or use the golden fixture",
    );
    expect(screen.getByTestId("architecture-intelligence-inbound-context")).not.toHaveTextContent(
      "Scoped to run",
    );
  });

  it("clears reasoning results when inbound runId switches to another review", async () => {
    let currentRunId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

    searchParamsGet.mockImplementation((key: string) => {
      if (key === "runId") {
        return currentRunId;
      }

      if (key === "from") {
        return "reviews";
      }

      return null;
    });

    stubProductContextFetch(currentRunId, "Architecture for review A.");

    const view = render(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Architecture for review A.",
      );
    });

    fireEvent.click(screen.getByTestId("architecture-intelligence-run-button"));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-reasoning-results")).toBeInTheDocument();
    });

    expect(screen.getByText("Stale finding from previous review")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-intelligence-analysis-setup-step-analyze")).toHaveTextContent("Done");

    currentRunId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    stubProductContextFetch(currentRunId, "Architecture for review B.");
    view.rerender(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Architecture for review B.",
      );
    });

    expect(screen.queryByTestId("architecture-intelligence-reasoning-results")).not.toBeInTheDocument();
    expect(screen.queryByText("Stale finding from previous review")).not.toBeInTheDocument();
  });

  it("clears reasoning results when operator scope switches workspaces", async () => {
    const { writeOperatorScopeToStorage } = await import("@/lib/operator/operator-scope-storage");

    writeOperatorScopeToStorage({
      tenantId: "tenant-a",
      workspaceId: "workspace-a",
      projectId: "project-a",
      workspaceLabel: "Workspace A",
      projectLabel: "Project A",
    });

    searchParamsGet.mockImplementation(() => null);

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";

        if (method === "POST" && url.includes("/architecture-intelligence/run")) {
          return {
            ok: true,
            json: async () => ({
              runId: "freeform-run",
              model: { elements: [] },
              specialistReviews: [
                {
                  findings: [
                    {
                      findingId: "finding-scope-a",
                      title: "Finding from workspace A",
                      severity: "Medium",
                      conclusion: "Must clear on scope switch",
                    },
                  ],
                },
              ],
              recommendations: [],
              mustNotFailViolations: [],
            }),
            text: async () => "",
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

    fireEvent.change(screen.getByTestId("architecture-intelligence-description"), {
      target: { value: "Freeform architecture for workspace A." },
    });
    fireEvent.click(screen.getByTestId("architecture-intelligence-run-button"));

    await waitFor(() => {
      expect(screen.getByText("Finding from workspace A")).toBeInTheDocument();
    });

    writeOperatorScopeToStorage({
      tenantId: "tenant-b",
      workspaceId: "workspace-b",
      projectId: "project-b",
      workspaceLabel: "Workspace B",
      projectLabel: "Project B",
    });

    await waitFor(() => {
      expect(screen.queryByTestId("architecture-intelligence-reasoning-results")).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue("");
    expect(screen.queryByText("Finding from workspace A")).not.toBeInTheDocument();
  });
});

describe("ArchitectureIntelligenceProductRoundTrip", () => {
  it("renders product deep links after publish", async () => {
    const { ArchitectureIntelligenceProductRoundTrip } = await import(
      "./ArchitectureIntelligenceProductRoundTrip"
    );

    render(
      <ArchitectureIntelligenceProductRoundTrip
        runId="run-abc"
        publishedToProduct
        publishedRecommendationCount={2}
      />,
    );

    expect(screen.getByTestId("architecture-intelligence-open-findings")).toHaveAttribute(
      "href",
      "/governance/findings?runId=run-abc",
    );
    expect(screen.getByTestId("architecture-intelligence-open-review")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-abc",
    );
    expect(screen.getByTestId("architecture-intelligence-open-advisory")).toHaveAttribute(
      "href",
      "/governance/advisory-scans?runId=run-abc",
    );
  });
});
