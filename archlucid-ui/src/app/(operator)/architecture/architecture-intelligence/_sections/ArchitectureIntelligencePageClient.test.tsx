import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArchitectureIntelligencePageClient } from "./ArchitectureIntelligencePageClient";

function okJsonFetchResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

const searchParamsGet = vi.fn<(key: string) => string | null>(() => null);

function stubProductContextFetch(runId: string, content: string): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (method === "GET" && url.includes("/product-runs/") && url.includes("/source-context")) {
        return okJsonFetchResponse(({
            runId,
            sourceTexts: [
              {
                fileName: "architecture-description.txt",
                contentType: "text/plain",
                content,
              },
            ],
          }));
      }

      if (method === "POST" && url.includes("/architecture-intelligence/run")) {
        return okJsonFetchResponse(({
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
          }));
      }

      return okJsonFetchResponse(({}));
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
          return okJsonFetchResponse(({
              runId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
              sourceTexts: [
                {
                  fileName: "architecture-description.txt",
                  contentType: "text/plain",
                  content: "Hydrated product architecture description.",
                },
              ],
            }));
        }

        return okJsonFetchResponse(({}));
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

  it("preserves freeform architecture description when workspace auto-pick deep-links to empty intake", async () => {
    let currentRunId: string | null = null;

    searchParamsGet.mockImplementation((key: string) => {
      if (key === "runId") {
        return currentRunId;
      }

      return null;
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = String(input);

        if (url.includes("/product-runs/") && url.includes("/source-context")) {
          return okJsonFetchResponse(({
              runId: currentRunId,
              sourceTexts: [],
            }));
        }

        return okJsonFetchResponse(({}));
      }),
    );

    const view = render(<ArchitectureIntelligencePageClient />);

    fireEvent.change(screen.getByTestId("architecture-intelligence-description"), {
      target: { value: "Operator pasted architecture before picking a review." },
    });

    expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
      "Operator pasted architecture before picking a review.",
    );

    currentRunId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    view.rerender(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-inbound-context")).toHaveTextContent(
        "no architecture intake",
      );
    });

    expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
      "Operator pasted architecture before picking a review.",
    );
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
          return okJsonFetchResponse(({
              runId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
              sourceTexts: [],
            }));
        }

        return okJsonFetchResponse(({}));
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

  it("shows loaded intake context after golden fixture on deep-linked review", async () => {
    searchParamsGet.mockImplementation((key: string) => {
      if (key === "runId") {
        return "ffffffff-ffff-ffff-ffff-ffffffffffff";
      }

      return null;
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";

        if (method === "GET" && url.includes("/product-runs/") && url.includes("/source-context")) {
          return okJsonFetchResponse(({
              runId: "ffffffff-ffff-ffff-ffff-ffffffffffff",
              sourceTexts: [],
            }));
        }

        if (method === "GET" && url.includes("/architecture-intelligence/golden-fixture")) {
          return okJsonFetchResponse(({
              sourceTexts: [
                {
                  fileName: "architecture-description.txt",
                  contentType: "text/plain",
                  content: "Golden fixture architecture description.",
                },
              ],
            }));
        }

        return okJsonFetchResponse(({}));
      }),
    );

    render(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-inbound-context")).toHaveTextContent(
        "no architecture intake",
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Load golden fixture" }));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Golden fixture architecture description.",
      );
    });

    expect(screen.getByTestId("architecture-intelligence-inbound-context")).toHaveTextContent(
      "Loaded product intake",
    );
    expect(screen.getByTestId("architecture-intelligence-inbound-context")).not.toHaveTextContent(
      "Scoped to run",
    );
    expect(screen.getByTestId("architecture-intelligence-analyze-review-button")).toBeInTheDocument();
  });

  it("clears reasoning results when golden fixture replaces hydrated intake", async () => {
    searchParamsGet.mockImplementation((key: string) => {
      if (key === "runId") {
        return "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
      }

      if (key === "from") {
        return "reviews";
      }

      return null;
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";

        if (method === "GET" && url.includes("/product-runs/") && url.includes("/source-context")) {
          return okJsonFetchResponse(({
              runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              sourceTexts: [
                {
                  fileName: "architecture-description.txt",
                  contentType: "text/plain",
                  content: "Architecture for review A.",
                },
              ],
            }));
        }

        if (method === "POST" && url.includes("/architecture-intelligence/run")) {
          return okJsonFetchResponse(({
              runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              model: { elements: [] },
              specialistReviews: [
                {
                  findings: [
                    {
                      findingId: "finding-before-fixture",
                      title: "Finding before fixture load",
                      severity: "High",
                      conclusion: "Must clear when intake is replaced by golden fixture",
                    },
                  ],
                },
              ],
              recommendations: [],
              mustNotFailViolations: [],
            }));
        }

        if (method === "GET" && url.includes("/architecture-intelligence/golden-fixture")) {
          return okJsonFetchResponse(({
              sourceTexts: [
                {
                  fileName: "architecture-description.txt",
                  contentType: "text/plain",
                  content: "Golden fixture architecture description.",
                },
              ],
            }));
        }

        return okJsonFetchResponse(({}));
      }),
    );

    render(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Architecture for review A.",
      );
    });

    fireEvent.click(screen.getByTestId("architecture-intelligence-run-button"));

    await waitFor(() => {
      expect(screen.getByText("Finding before fixture load")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Load golden fixture" }));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Golden fixture architecture description.",
      );
    });

    expect(screen.queryByTestId("architecture-intelligence-reasoning-results")).not.toBeInTheDocument();
    expect(screen.queryByText("Finding before fixture load")).not.toBeInTheDocument();
  });

  it("clears publish-to-product toggle when golden fixture replaces hydrated intake", async () => {
    searchParamsGet.mockImplementation((key: string) => {
      if (key === "runId") {
        return "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
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
          return okJsonFetchResponse(({
              runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              sourceTexts: [
                {
                  fileName: "architecture-description.txt",
                  contentType: "text/plain",
                  content: "Architecture for review A.",
                },
              ],
            }));
        }

        if (url.includes("/architecture-intelligence/golden-fixture")) {
          return okJsonFetchResponse(({
              sourceTexts: [
                {
                  fileName: "architecture-description.txt",
                  contentType: "text/plain",
                  content: "Golden fixture architecture description.",
                },
              ],
            }));
        }

        return okJsonFetchResponse(({}));
      }),
    );

    render(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Architecture for review A.",
      );
    });

    fireEvent.click(screen.getByTestId("architecture-intelligence-publish-toggle"));
    expect(screen.getByTestId("architecture-intelligence-publish-toggle")).toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: "Load golden fixture" }));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Golden fixture architecture description.",
      );
    });

    expect(screen.getByTestId("architecture-intelligence-publish-toggle")).not.toBeChecked();
  });

  it("clears declared priorities when deep-linked review switches to one without priorities", async () => {
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

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = String(input);

        if (url.includes("/product-runs/") && url.includes("/source-context")) {
          if (currentRunId === "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa") {
            return okJsonFetchResponse(({
                runId: currentRunId,
                sourceTexts: [
                  {
                    fileName: "architecture-description.txt",
                    contentType: "text/plain",
                    content: "Architecture for review A.",
                  },
                ],
                declaredPriorities: ["security", "reliability"],
              }));
          }

          return okJsonFetchResponse(({
              runId: currentRunId,
              sourceTexts: [
                {
                  fileName: "architecture-description.txt",
                  contentType: "text/plain",
                  content: "Architecture for review B.",
                },
              ],
              declaredPriorities: [],
            }));
        }

        return okJsonFetchResponse(({}));
      }),
    );

    const view = render(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-priorities")).toHaveValue("security, reliability");
    });

    currentRunId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    view.rerender(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Architecture for review B.",
      );
    });

    expect(screen.getByTestId("architecture-intelligence-priorities")).toHaveValue("");
  });

  it("clears hydrated intake and review scope when deep-linked runId is removed from the URL", async () => {
    searchParamsGet.mockImplementation((key: string) => {
      if (key === "runId") {
        return "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
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
          return okJsonFetchResponse(({
              runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              sourceTexts: [
                {
                  fileName: "architecture-description.txt",
                  contentType: "text/plain",
                  content: "Architecture for review A.",
                },
              ],
              declaredPriorities: ["security"],
            }));
        }

        return okJsonFetchResponse(({}));
      }),
    );

    const view = render(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Architecture for review A.",
      );
    });

    expect(screen.getByTestId("architecture-intelligence-run-scope-banner")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-intelligence-analyze-review-button")).toBeInTheDocument();

    searchParamsGet.mockImplementation(() => null);
    view.rerender(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.queryByTestId("architecture-intelligence-run-scope-banner")).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue("");
    expect(screen.getByTestId("architecture-intelligence-priorities")).toHaveValue("");
    expect(screen.queryByTestId("architecture-intelligence-analyze-review-button")).not.toBeInTheDocument();
    expect(screen.getByTestId("architecture-intelligence-analysis-setup-step-review")).toHaveAttribute(
      "data-emphasized",
      "true",
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

  it("ignores stale reasoning results when inbound runId switches before run completes", async () => {
    let currentRunId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    let resolveRunPost: (() => void) | null = null;
    const runPostGate = new Promise<void>((resolve) => {
      resolveRunPost = resolve;
    });

    searchParamsGet.mockImplementation((key: string) => {
      if (key === "runId") {
        return currentRunId;
      }

      if (key === "from") {
        return "reviews";
      }

      return null;
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";

        if (method === "GET" && url.includes("/product-runs/") && url.includes("/source-context")) {
          return okJsonFetchResponse(({
              runId: currentRunId,
              sourceTexts: [
                {
                  fileName: "architecture-description.txt",
                  contentType: "text/plain",
                  content: currentRunId.startsWith("a") ? "Architecture for review A." : "Architecture for review B.",
                },
              ],
            }));
        }

        if (method === "POST" && url.includes("/architecture-intelligence/run")) {
          await runPostGate;

          return okJsonFetchResponse(({
              runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              model: { elements: [] },
              specialistReviews: [
                {
                  findings: [
                    {
                      findingId: "stale-in-flight",
                      title: "Stale in-flight finding",
                      severity: "High",
                      conclusion: "Must not appear after run switch",
                    },
                  ],
                },
              ],
              recommendations: [],
              mustNotFailViolations: [],
            }));
        }

        return okJsonFetchResponse(({}));
      }),
    );

    const view = render(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Architecture for review A.",
      );
    });

    fireEvent.click(screen.getByTestId("architecture-intelligence-run-button"));

    currentRunId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    view.rerender(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Architecture for review B.",
      );
    });

    resolveRunPost?.();

    await waitFor(() => {
      expect(screen.queryByText("Stale in-flight finding")).not.toBeInTheDocument();
    });

    expect(screen.queryByTestId("architecture-intelligence-reasoning-results")).not.toBeInTheDocument();
  });

  it("clears publish-to-product toggle when deep-linked review switches to another review", async () => {
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

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = String(input);

        if (url.includes("/product-runs/") && url.includes("/source-context")) {
          return okJsonFetchResponse(({
              runId: currentRunId,
              sourceTexts: [
                {
                  fileName: "architecture-description.txt",
                  contentType: "text/plain",
                  content: `Architecture for review ${currentRunId.slice(0, 1).toUpperCase()}.`,
                },
              ],
            }));
        }

        return okJsonFetchResponse(({}));
      }),
    );

    const view = render(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Architecture for review A.",
      );
    });

    fireEvent.click(screen.getByTestId("architecture-intelligence-publish-toggle"));
    expect(screen.getByTestId("architecture-intelligence-publish-toggle")).toBeChecked();

    currentRunId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    view.rerender(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Architecture for review B.",
      );
    });

    expect(screen.getByTestId("architecture-intelligence-publish-toggle")).not.toBeChecked();
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
          return okJsonFetchResponse(({
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
            }));
        }

        return okJsonFetchResponse(({}));
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

  it("reloads hydrated intake when operator scope switches on a deep-linked review", async () => {
    const { writeOperatorScopeToStorage } = await import("@/lib/operator/operator-scope-storage");

    const runId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    let activeTenant = "tenant-a";

    writeOperatorScopeToStorage({
      tenantId: "tenant-a",
      workspaceId: "workspace-a",
      projectId: "project-a",
      workspaceLabel: "Workspace A",
      projectLabel: "Project A",
    });

    searchParamsGet.mockImplementation((key: string) => {
      if (key === "runId") {
        return runId;
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

        if (url.includes("/source-context")) {
          const content =
            activeTenant === "tenant-a"
              ? "Architecture intake for tenant A."
              : "Architecture intake for tenant B.";

          return okJsonFetchResponse(({
              runId,
              sourceTexts: [
                {
                  fileName: "architecture-description.txt",
                  contentType: "text/plain",
                  content,
                },
              ],
            }));
        }

        return okJsonFetchResponse(({}));
      }),
    );

    render(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Architecture intake for tenant A.",
      );
    });

    activeTenant = "tenant-b";
    writeOperatorScopeToStorage({
      tenantId: "tenant-b",
      workspaceId: "workspace-b",
      projectId: "project-b",
      workspaceLabel: "Workspace B",
      projectLabel: "Project B",
    });

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Architecture intake for tenant B.",
      );
    });

    expect(screen.queryByDisplayValue("Architecture intake for tenant A.")).not.toBeInTheDocument();
  });

  it("clears golden test results when golden fixture replaces hydrated intake", async () => {
    searchParamsGet.mockImplementation((key: string) => {
      if (key === "runId") {
        return "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
      }

      if (key === "from") {
        return "reviews";
      }

      return null;
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";

        if (method === "GET" && url.includes("/product-runs/") && url.includes("/source-context")) {
          return okJsonFetchResponse(({
              runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              sourceTexts: [
                {
                  fileName: "architecture-description.txt",
                  contentType: "text/plain",
                  content: "Architecture for review A.",
                },
              ],
            }));
        }

        if (method === "POST" && url.includes("/architecture-intelligence/golden-test")) {
          return okJsonFetchResponse(({
              passed: true,
              plantedDefectRecall: 1,
              falsePositiveCount: 0,
              mutationChangedFindings: false,
              beforeCounts: { High: 1 },
              afterCounts: { High: 1 },
              notes: "Golden test marker before fixture load",
            }));
        }

        if (method === "GET" && url.includes("/architecture-intelligence/golden-fixture")) {
          return okJsonFetchResponse(({
              sourceTexts: [
                {
                  fileName: "architecture-description.txt",
                  contentType: "text/plain",
                  content: "Golden fixture architecture description.",
                },
              ],
            }));
        }

        return okJsonFetchResponse(({}));
      }),
    );

    render(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Architecture for review A.",
      );
    });

    fireEvent.click(screen.getByTestId("architecture-intelligence-golden-test-button"));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-golden-results")).toBeInTheDocument();
    });

    expect(screen.getByTestId("architecture-intelligence-golden-notes")).toHaveTextContent(
      "Golden test marker before fixture load",
    );

    fireEvent.click(screen.getByRole("button", { name: "Load golden fixture" }));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Golden fixture architecture description.",
      );
    });

    expect(screen.queryByTestId("architecture-intelligence-golden-results")).not.toBeInTheDocument();
    expect(screen.queryByText("Golden test marker before fixture load")).not.toBeInTheDocument();
  });

  it("clears golden test results when inbound runId switches to another review", async () => {
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

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";

        if (method === "GET" && url.includes("/product-runs/") && url.includes("/source-context")) {
          return okJsonFetchResponse(({
              runId: currentRunId,
              sourceTexts: [
                {
                  fileName: "architecture-description.txt",
                  contentType: "text/plain",
                  content: currentRunId.startsWith("a") ? "Architecture for review A." : "Architecture for review B.",
                },
              ],
            }));
        }

        if (method === "POST" && url.includes("/architecture-intelligence/golden-test")) {
          return okJsonFetchResponse(({
              passed: true,
              plantedDefectRecall: 1,
              falsePositiveCount: 0,
              mutationChangedFindings: false,
              beforeCounts: { High: 1 },
              afterCounts: { High: 1 },
              notes: "Golden test marker from review A",
            }));
        }

        return okJsonFetchResponse(({}));
      }),
    );

    const view = render(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Architecture for review A.",
      );
    });

    fireEvent.click(screen.getByTestId("architecture-intelligence-golden-test-button"));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-golden-notes")).toHaveTextContent(
        "Golden test marker from review A",
      );
    });

    currentRunId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    view.rerender(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Architecture for review B.",
      );
    });

    expect(screen.queryByTestId("architecture-intelligence-golden-results")).not.toBeInTheDocument();
    expect(screen.queryByText("Golden test marker from review A")).not.toBeInTheDocument();
  });

  it("clears interview answers when deep-linked review switches to another review", async () => {
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

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";

        if (method === "GET" && url.includes("/product-runs/") && url.includes("/source-context")) {
          return okJsonFetchResponse(({
              runId: currentRunId,
              sourceTexts: [
                {
                  fileName: "architecture-description.txt",
                  contentType: "text/plain",
                  content: currentRunId.startsWith("a") ? "Architecture for review A." : "Architecture for review B.",
                },
              ],
            }));
        }

        if (method === "POST" && url.includes("/architecture-intelligence/run")) {
          return okJsonFetchResponse(({
              runId: currentRunId,
              model: { elements: [] },
              specialistReviews: [],
              recommendations: [],
              mustNotFailViolations: [],
              interview: {
                framingQuestions: [
                  {
                    questionId: "scope-clarification",
                    prompt: "What is the blast radius for this change?",
                  },
                ],
                evidenceDrivenQuestions: [],
              },
            }));
        }

        return okJsonFetchResponse(({}));
      }),
    );

    const view = render(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Architecture for review A.",
      );
    });

    fireEvent.click(screen.getByTestId("architecture-intelligence-run-button"));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-interview-scope-clarification")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("architecture-intelligence-interview-scope-clarification"), {
      target: { value: "Single region only." },
    });

    expect(screen.getByTestId("architecture-intelligence-interview-scope-clarification")).toHaveValue(
      "Single region only.",
    );

    currentRunId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    view.rerender(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Architecture for review B.",
      );
    });

    expect(screen.queryByTestId("architecture-intelligence-reasoning-results")).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-intelligence-interview-scope-clarification")).not.toBeInTheDocument();
  });

  it("ignores stale continue results when inbound runId switches before continue completes", async () => {
    let currentRunId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    let resolveContinuePost: (() => void) | null = null;
    const continuePostGate = new Promise<void>((resolve) => {
      resolveContinuePost = resolve;
    });

    searchParamsGet.mockImplementation((key: string) => {
      if (key === "runId") {
        return currentRunId;
      }

      if (key === "from") {
        return "reviews";
      }

      return null;
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";

        if (method === "GET" && url.includes("/product-runs/") && url.includes("/source-context")) {
          return okJsonFetchResponse(({
              runId: currentRunId,
              sourceTexts: [
                {
                  fileName: "architecture-description.txt",
                  contentType: "text/plain",
                  content: currentRunId.startsWith("a") ? "Architecture for review A." : "Architecture for review B.",
                },
              ],
            }));
        }

        if (method === "POST" && url.includes("/architecture-intelligence/run")) {
          return okJsonFetchResponse(({
              runId: currentRunId,
              model: { elements: [] },
              specialistReviews: [
                {
                  findings: [
                    {
                      findingId: "initial-finding",
                      title: "Initial finding",
                      severity: "High",
                      conclusion: "Visible before continue",
                    },
                  ],
                },
              ],
              recommendations: [],
              mustNotFailViolations: [],
              interview: {
                framingQuestions: [
                  {
                    questionId: "scope-clarification",
                    prompt: "What is the blast radius for this change?",
                  },
                ],
                evidenceDrivenQuestions: [],
              },
            }));
        }

        if (method === "POST" && url.includes("/architecture-intelligence/runs/") && url.includes("/continue")) {
          await continuePostGate;

          return okJsonFetchResponse(({
              runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              model: { elements: [] },
              specialistReviews: [
                {
                  findings: [
                    {
                      findingId: "stale-continue-finding",
                      title: "Stale continue finding",
                      severity: "High",
                      conclusion: "Must not appear after run switch",
                    },
                  ],
                },
              ],
              recommendations: [],
              mustNotFailViolations: [],
            }));
        }

        return okJsonFetchResponse(({}));
      }),
    );

    const view = render(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Architecture for review A.",
      );
    });

    fireEvent.click(screen.getByTestId("architecture-intelligence-run-button"));

    await waitFor(() => {
      expect(screen.getByText("Initial finding")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("architecture-intelligence-resubmit-answers"));

    currentRunId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    view.rerender(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Architecture for review B.",
      );
    });

    resolveContinuePost?.();

    await waitFor(() => {
      expect(screen.queryByText("Stale continue finding")).not.toBeInTheDocument();
    });

    expect(screen.queryByTestId("architecture-intelligence-reasoning-results")).not.toBeInTheDocument();
  });

  it("ignores stale publish results when inbound runId switches before publish completes", async () => {
    let currentRunId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    let resolvePublishPost: (() => void) | null = null;
    const publishPostGate = new Promise<void>((resolve) => {
      resolvePublishPost = resolve;
    });

    searchParamsGet.mockImplementation((key: string) => {
      if (key === "runId") {
        return currentRunId;
      }

      if (key === "from") {
        return "reviews";
      }

      return null;
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";

        if (method === "GET" && url.includes("/product-runs/") && url.includes("/source-context")) {
          return okJsonFetchResponse(({
              runId: currentRunId,
              sourceTexts: [
                {
                  fileName: "architecture-description.txt",
                  contentType: "text/plain",
                  content: currentRunId.startsWith("a") ? "Architecture for review A." : "Architecture for review B.",
                },
              ],
            }));
        }

        if (method === "POST" && url.includes("/architecture-intelligence/run")) {
          return okJsonFetchResponse(({
              runId: currentRunId,
              model: { elements: [] },
              specialistReviews: [
                {
                  findings: [
                    {
                      findingId: "initial-finding",
                      title: "Initial finding",
                      severity: "High",
                      conclusion: "Visible before publish",
                    },
                  ],
                },
              ],
              recommendations: [],
              mustNotFailViolations: [],
            }));
        }

        if (method === "POST" && url.includes("/architecture-intelligence/runs/") && url.includes("/publish")) {
          await publishPostGate;

          return okJsonFetchResponse(({
              runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              model: { elements: [] },
              specialistReviews: [
                {
                  findings: [
                    {
                      findingId: "stale-publish-finding",
                      title: "Stale publish finding",
                      severity: "High",
                      conclusion: "Must not appear after run switch",
                    },
                  ],
                },
              ],
              recommendations: [],
              mustNotFailViolations: [],
              publishedToProduct: true,
            }));
        }

        return okJsonFetchResponse(({}));
      }),
    );

    const view = render(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Architecture for review A.",
      );
    });

    fireEvent.click(screen.getByTestId("architecture-intelligence-run-button"));

    await waitFor(() => {
      expect(screen.getByText("Initial finding")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("architecture-intelligence-publish-button"));

    currentRunId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    view.rerender(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Architecture for review B.",
      );
    });

    resolvePublishPost?.();

    await waitFor(() => {
      expect(screen.queryByText("Stale publish finding")).not.toBeInTheDocument();
    });

    expect(screen.queryByTestId("architecture-intelligence-reasoning-results")).not.toBeInTheDocument();
  });

  it("clears hydrated description when deep-linked review switches to empty intake", async () => {
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

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = String(input);

        if (url.includes("/product-runs/") && url.includes("/source-context")) {
          return okJsonFetchResponse(({
              runId: currentRunId,
              sourceTexts: currentRunId.startsWith("a")
                ? [
                    {
                      fileName: "architecture-description.txt",
                      contentType: "text/plain",
                      content: "Architecture for review A.",
                    },
                  ]
                : [],
            }));
        }

        return okJsonFetchResponse(({}));
      }),
    );

    const view = render(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Architecture for review A.",
      );
    });

    fireEvent.change(screen.getByTestId("architecture-intelligence-description"), {
      target: { value: "Operator edits while scoped to review A." },
    });

    currentRunId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    view.rerender(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-inbound-context")).toHaveTextContent(
        "Load failed or empty",
      );
    });

    expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue("");
  });

  it("clears golden test results when operator scope switches workspaces", async () => {
    const { writeOperatorScopeToStorage } = await import("@/lib/operator/operator-scope-storage");

    writeOperatorScopeToStorage({
      tenantId: "tenant-a",
      workspaceId: "workspace-a",
      projectId: "project-a",
      workspaceLabel: "Workspace A",
      projectLabel: "Project A",
    });

    searchParamsGet.mockImplementation((key: string) => {
      if (key === "runId") {
        return "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
      }

      if (key === "from") {
        return "reviews";
      }

      return null;
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";

        if (method === "GET" && url.includes("/product-runs/") && url.includes("/source-context")) {
          return okJsonFetchResponse(({
              runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              sourceTexts: [
                {
                  fileName: "architecture-description.txt",
                  contentType: "text/plain",
                  content: "Architecture intake for tenant A.",
                },
              ],
            }));
        }

        if (method === "POST" && url.includes("/architecture-intelligence/golden-test")) {
          return okJsonFetchResponse(({
              passed: true,
              plantedDefectRecall: 1,
              falsePositiveCount: 0,
              mutationChangedFindings: false,
              beforeCounts: { High: 1 },
              afterCounts: { High: 1 },
              notes: "Golden test marker before scope switch",
            }));
        }

        return okJsonFetchResponse(({}));
      }),
    );

    render(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Architecture intake for tenant A.",
      );
    });

    fireEvent.click(screen.getByTestId("architecture-intelligence-golden-test-button"));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-golden-results")).toBeInTheDocument();
    });

    writeOperatorScopeToStorage({
      tenantId: "tenant-b",
      workspaceId: "workspace-b",
      projectId: "project-b",
      workspaceLabel: "Workspace B",
      projectLabel: "Project B",
    });

    await waitFor(() => {
      expect(screen.queryByTestId("architecture-intelligence-golden-results")).not.toBeInTheDocument();
    });
  });

  it("clears interview answers when golden fixture replaces hydrated intake", async () => {
    searchParamsGet.mockImplementation((key: string) => {
      if (key === "runId") {
        return "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
      }

      if (key === "from") {
        return "reviews";
      }

      return null;
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";

        if (method === "GET" && url.includes("/product-runs/") && url.includes("/source-context")) {
          return okJsonFetchResponse(({
              runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              sourceTexts: [
                {
                  fileName: "architecture-description.txt",
                  contentType: "text/plain",
                  content: "Architecture for review A.",
                },
              ],
            }));
        }

        if (method === "POST" && url.includes("/architecture-intelligence/run")) {
          return okJsonFetchResponse(({
              runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              model: { elements: [] },
              specialistReviews: [],
              recommendations: [],
              mustNotFailViolations: [],
              interview: {
                framingQuestions: [
                  {
                    questionId: "scope-clarification",
                    prompt: "What is the blast radius for this change?",
                  },
                ],
                evidenceDrivenQuestions: [],
              },
            }));
        }

        if (method === "GET" && url.includes("/architecture-intelligence/golden-fixture")) {
          return okJsonFetchResponse(({
              sourceTexts: [
                {
                  fileName: "architecture-description.txt",
                  contentType: "text/plain",
                  content: "Golden fixture architecture description.",
                },
              ],
            }));
        }

        return okJsonFetchResponse(({}));
      }),
    );

    render(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Architecture for review A.",
      );
    });

    fireEvent.click(screen.getByTestId("architecture-intelligence-run-button"));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-interview-scope-clarification")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("architecture-intelligence-interview-scope-clarification"), {
      target: { value: "Single region only." },
    });

    fireEvent.click(screen.getByRole("button", { name: "Load golden fixture" }));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Golden fixture architecture description.",
      );
    });

    expect(screen.queryByTestId("architecture-intelligence-interview-scope-clarification")).not.toBeInTheDocument();
  });

  it("clears declared priorities when golden fixture omits declaredPriorities", async () => {
    searchParamsGet.mockImplementation((key: string) => {
      if (key === "runId") {
        return "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
      }

      if (key === "from") {
        return "reviews";
      }

      return null;
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";

        if (method === "GET" && url.includes("/product-runs/") && url.includes("/source-context")) {
          return okJsonFetchResponse(({
              runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              sourceTexts: [
                {
                  fileName: "architecture-description.txt",
                  contentType: "text/plain",
                  content: "Architecture for review A.",
                },
              ],
              declaredPriorities: ["security", "reliability"],
            }));
        }

        if (method === "GET" && url.includes("/architecture-intelligence/golden-fixture")) {
          return okJsonFetchResponse(({
              sourceTexts: [
                {
                  fileName: "architecture-description.txt",
                  contentType: "text/plain",
                  content: "Golden fixture architecture description.",
                },
              ],
            }));
        }

        return okJsonFetchResponse(({}));
      }),
    );

    render(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-priorities")).toHaveValue("security, reliability");
    });

    fireEvent.click(screen.getByRole("button", { name: "Load golden fixture" }));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-priorities")).toHaveValue("");
    });
  });

  it("hydrates intake after successful product context retry", async () => {
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

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = String(input);

        if (url.includes("/product-runs/") && url.includes("/source-context")) {
          sourceContextAttempt += 1;

          if (sourceContextAttempt === 1) {
            return new Response("Unable to load product context", { status: 503 });
          }

          return okJsonFetchResponse(({
              runId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
              sourceTexts: [
                {
                  fileName: "architecture-description.txt",
                  contentType: "text/plain",
                  content: "Hydrated after retry.",
                },
              ],
            }));
        }

        return okJsonFetchResponse(({}));
      }),
    );

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
  });

  it("keeps freeform intake when only contextRunId scopes the page", async () => {
    searchParamsGet.mockImplementation((key: string) => {
      if (key === "contextRunId") {
        return "cccccccc-cccc-cccc-cccc-cccccccccccc";
      }

      return null;
    });

    render(<ArchitectureIntelligencePageClient />);

    fireEvent.change(screen.getByTestId("architecture-intelligence-description"), {
      target: { value: "Freeform intake before picking a review from the strip." },
    });

    expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
      "Freeform intake before picking a review from the strip.",
    );
    expect(screen.getByTestId("architecture-intelligence-run-scope-banner")).toHaveTextContent(
      "cccccccc-cccc-cccc-cccc-cccccccccccc",
    );
  });

  it("hides analyze affordance when deep-linked review has empty product context", async () => {
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
          return okJsonFetchResponse({
            runId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
            sourceTexts: [],
          });
        }

        return okJsonFetchResponse({});
      }),
    );

    render(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-inbound-context")).toHaveTextContent(
        "no architecture intake",
      );
    });

    fireEvent.change(screen.getByTestId("architecture-intelligence-description"), {
      target: { value: "Operator pasted architecture on empty deep-link." },
    });

    expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
      "Operator pasted architecture on empty deep-link.",
    );
    expect(screen.queryByTestId("architecture-intelligence-analyze-review-button")).not.toBeInTheDocument();
  });

  it("ignores stale analyze results when inbound runId switches before analyze completes", async () => {
    let currentRunId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    let resolveAnalyzePost: (() => void) | null = null;
    const analyzePostGate = new Promise<void>((resolve) => {
      resolveAnalyzePost = resolve;
    });

    searchParamsGet.mockImplementation((key: string) => {
      if (key === "runId") {
        return currentRunId;
      }

      if (key === "from") {
        return "reviews";
      }

      return null;
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";

        if (method === "GET" && url.includes("/product-runs/") && url.includes("/source-context")) {
          return okJsonFetchResponse({
            runId: currentRunId,
            sourceTexts: [
              {
                fileName: "architecture-description.txt",
                contentType: "text/plain",
                content: currentRunId.startsWith("a") ? "Architecture for review A." : "Architecture for review B.",
              },
            ],
          });
        }

        if (method === "POST" && url.includes("/architecture-intelligence/run")) {
          await analyzePostGate;

          return okJsonFetchResponse({
            runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            model: { elements: [] },
            specialistReviews: [
              {
                findings: [
                  {
                    findingId: "stale-analyze-in-flight",
                    title: "Stale analyze finding",
                    severity: "High",
                    conclusion: "Must not appear after run switch",
                  },
                ],
              },
            ],
            recommendations: [],
            mustNotFailViolations: [],
          });
        }

        return okJsonFetchResponse({});
      }),
    );

    const view = render(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-analyze-review-button")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("architecture-intelligence-analyze-review-button"));

    currentRunId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    view.rerender(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Architecture for review B.",
      );
    });

    resolveAnalyzePost?.();

    await waitFor(() => {
      expect(screen.queryByText("Stale analyze finding")).not.toBeInTheDocument();
    });

    expect(screen.queryByTestId("architecture-intelligence-reasoning-results")).not.toBeInTheDocument();
  });

  it("keeps hydrated intake when deep-linked runId is removed but matching contextRunId remains", async () => {
    searchParamsGet.mockImplementation((key: string) => {
      if (key === "runId") {
        return "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
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
          return okJsonFetchResponse({
            runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            sourceTexts: [
              {
                fileName: "architecture-description.txt",
                contentType: "text/plain",
                content: "Architecture for review A.",
              },
            ],
          });
        }

        return okJsonFetchResponse({});
      }),
    );

    const view = render(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Architecture for review A.",
      );
    });

    searchParamsGet.mockImplementation((key: string) => {
      if (key === "contextRunId") {
        return "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
      }

      return null;
    });
    view.rerender(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-run-scope-banner")).toHaveTextContent(
        "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      );
    });

    expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
      "Architecture for review A.",
    );
    expect(screen.getByTestId("architecture-intelligence-analyze-review-button")).toBeInTheDocument();
  });

  it("hydrates review tier from URL tier search param", () => {
    searchParamsGet.mockImplementation((key: string) => {
      if (key === "tier") {
        return "Deep";
      }

      return null;
    });

    render(<ArchitectureIntelligencePageClient />);

    expect(screen.getByTestId("architecture-intelligence-review-tier")).toHaveTextContent(
      "Deep (most specialist roles, highest cost)",
    );
  });

  it("clears hydrated intake when contextRunId switches to another review without inbound runId", async () => {
    searchParamsGet.mockImplementation((key: string) => {
      if (key === "runId") {
        return "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
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
          return okJsonFetchResponse({
            runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            sourceTexts: [
              {
                fileName: "architecture-description.txt",
                contentType: "text/plain",
                content: "Architecture for review A.",
              },
            ],
            declaredPriorities: ["security"],
          });
        }

        return okJsonFetchResponse({});
      }),
    );

    const view = render(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Architecture for review A.",
      );
    });

    searchParamsGet.mockImplementation((key: string) => {
      if (key === "contextRunId") {
        return "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
      }

      return null;
    });
    view.rerender(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-run-scope-banner")).toHaveTextContent(
        "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      );
    });

    expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue("");
    expect(screen.getByTestId("architecture-intelligence-priorities")).toHaveValue("");
    expect(screen.queryByTestId("architecture-intelligence-analyze-review-button")).not.toBeInTheDocument();
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
