import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildArchitectureIntelligenceRunRequest,
  buildArchitectureIntelligenceSourcesFromDraftFields,
  fetchArchitectureIntelligenceProductSourceContext,
  formatArchitectureIntelligenceSpendSummary,
  primaryDescriptionFromSources,
  runArchitectureIntelligenceReasoning,
} from "@/lib/architecture/architecture-intelligence-api";
import { writeOperatorScopeToStorage } from "@/lib/operator/operator-scope-storage";

describe("architecture-intelligence-api", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("forwards operator scope headers on product source-context GET", async () => {
    const tenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const workspaceId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const projectId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    writeOperatorScopeToStorage({ tenantId, workspaceId, projectId });

    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ sourceTexts: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchArchitectureIntelligenceProductSourceContext("run-1");

    expect(fetchMock).toHaveBeenCalledOnce();
    const headers = new Headers((fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.headers);
    expect(headers.get("x-tenant-id")).toBe(tenantId);
    expect(headers.get("x-workspace-id")).toBe(workspaceId);
    expect(headers.get("x-project-id")).toBe(projectId);

    vi.unstubAllGlobals();
  });

  it("forwards operator scope headers on reasoning POST", async () => {
    const tenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const workspaceId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const projectId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    writeOperatorScopeToStorage({ tenantId, workspaceId, projectId });

    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ runId: "run-1" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await runArchitectureIntelligenceReasoning({ sourceTexts: [] });

    expect(fetchMock).toHaveBeenCalledOnce();
    const headers = new Headers((fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.headers);
    expect(headers.get("x-tenant-id")).toBe(tenantId);
    expect(headers.get("x-workspace-id")).toBe(workspaceId);
    expect(headers.get("x-project-id")).toBe(projectId);

    vi.unstubAllGlobals();
  });

  it("prefers the architecture-description source for the primary text", () => {
    expect(
      primaryDescriptionFromSources([
        { fileName: "other.md", contentType: "text/markdown", content: "secondary" },
        {
          fileName: "architecture-description.txt",
          contentType: "text/plain",
          content: "  primary brief  ",
        },
      ]),
    ).toBe("primary brief");
  });

  it("builds source texts from draft form fields", () => {
    expect(
      buildArchitectureIntelligenceSourcesFromDraftFields({
        systemName: "Claims intake",
        freeTextIntent: "Modernize routing",
        businessOutcome: "Reduce manual work",
      }),
    ).toEqual([
      {
        fileName: "architecture-description.txt",
        contentType: "text/plain",
        content: "System: Claims intake\n\nModernize routing\n\nBusiness outcome: Reduce manual work",
      },
    ]);

    expect(
      buildArchitectureIntelligenceSourcesFromDraftFields({
        systemName: "  ",
        freeTextIntent: "",
        businessOutcome: "",
      }),
    ).toEqual([]);
  });

  it("builds a publish request over hydrated sources", () => {
    const body = buildArchitectureIntelligenceRunRequest({
      architectureDescription: "Updated brief",
      priorities: ["security"],
      runId: "run-1",
      publishToProduct: true,
      reviewTier: "Deep",
      hydratedSourceTexts: [
        {
          fileName: "architecture-description.txt",
          contentType: "text/plain",
          content: "Old brief",
        },
        {
          fileName: "diagram.md",
          contentType: "text/markdown",
          content: "edges",
        },
      ],
    });

    expect(body).toMatchObject({
      publishToProduct: true,
      runId: "run-1",
      reviewTier: "Deep",
      declaredPriorities: ["security"],
    });
    expect(body).not.toHaveProperty("tenantId");
    expect(body.sourceTexts).toEqual([
      {
        fileName: "architecture-description.txt",
        contentType: "text/plain",
        content: "Updated brief",
      },
      {
        fileName: "diagram.md",
        contentType: "text/markdown",
        content: "edges",
      },
    ]);
  });

  it("formats USD spend before token fallback", () => {
    expect(
      formatArchitectureIntelligenceSpendSummary({
        budgetEstimatedCostUsd: 0.42,
        budgetRemainingUsd: 12,
        budgetEstimatedTokens: 100,
        budgetMaxTokens: 1000,
      }),
    ).toBe(" · Estimated cost $0.42 · $12.00 AI budget remaining");

    expect(
      formatArchitectureIntelligenceSpendSummary({
        budgetEstimatedTokens: 100,
        budgetMaxTokens: 1000,
      }),
    ).toBe(" · Est. tokens 100/1000");
  });
});
