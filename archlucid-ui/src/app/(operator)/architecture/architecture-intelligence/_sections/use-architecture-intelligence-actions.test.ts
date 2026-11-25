import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useArchitectureIntelligenceActions } from "./use-architecture-intelligence-actions";
import type { UseArchitectureIntelligenceProductContextResult } from "./use-architecture-intelligence-product-context";

vi.mock("./architecture-intelligence-client-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./architecture-intelligence-client-api")>();
  return {
    ...actual,
    postJson: vi.fn(),
  };
});

import { postJson } from "./architecture-intelligence-client-api";

function createContext(
  overrides: Partial<UseArchitectureIntelligenceProductContextResult> = {},
): UseArchitectureIntelligenceProductContextResult {
  return {
    architectureDescription: "",
    prioritiesRaw: "",
    interviewAnswers: {},
    publishToProduct: false,
    activeRunId: null,
    hydratedSourceTexts: [
      {
        fileName: "network-diagram.png",
        contentType: "image/png",
        content: "attachment body",
      },
    ],
    reviewTier: "Standard",
    canAnalyzeHydratedReview: false,
    setLoadingAction: vi.fn(),
    setError: vi.fn(),
    setPublishToProduct: vi.fn(),
    setRunState: vi.fn(),
    setInterviewAnswers: vi.fn(),
    setActiveRunId: vi.fn(),
    setHydratedSourceTexts: vi.fn(),
    setArchitectureDescription: vi.fn(),
    setPrioritiesRaw: vi.fn(),
    markProductContextLoaded: vi.fn(),
    loadingAction: null,
    actionGenerationRef: { current: 0 },
    invalidateInFlightActions: vi.fn(),
    ...overrides,
  } as UseArchitectureIntelligenceProductContextResult;
}

describe("useArchitectureIntelligenceActions", () => {
  it("runReasoning posts attachment-only hydrated intake when the textarea is empty", async () => {
    const postJsonMock = vi.mocked(postJson);
    postJsonMock.mockResolvedValue({
      runId: "run-1",
      specialistReviews: [],
    });

    const ctx = createContext();
    const { result } = renderHook(() => useArchitectureIntelligenceActions(ctx));

    await act(async () => {
      await result.current.runReasoning();
    });

    expect(postJsonMock).toHaveBeenCalledOnce();
    expect(
      vi
        .mocked(ctx.setError)
        .mock.calls.some((call) => typeof call[0] === "string" && call[0].length > 0),
    ).toBe(false);
  });

  it("analyzeThisReview posts when attachment-only hydrated intake can analyze", async () => {
    const postJsonMock = vi.mocked(postJson);
    postJsonMock.mockResolvedValue({
      runId: "run-1",
      specialistReviews: [],
    });

    const ctx = createContext({
      activeRunId: "run-1",
      canAnalyzeHydratedReview: true,
    });
    const { result } = renderHook(() => useArchitectureIntelligenceActions(ctx));

    await act(async () => {
      await result.current.analyzeThisReview();
    });

    expect(postJsonMock).toHaveBeenCalledOnce();
    const body = postJsonMock.mock.calls[0]?.[1] as { publishToProduct?: boolean };
    expect(body.publishToProduct).toBe(true);
  });

  it("clears prior reasoning output before a golden test POST", async () => {
    const postJsonMock = vi.mocked(postJson);
    let resolvePost: (value: unknown) => void;
    const postPromise = new Promise((resolve) => {
      resolvePost = resolve;
    });
    postJsonMock.mockReturnValue(postPromise as Promise<unknown>);

    const ctx = createContext({
      architectureDescription: "Brief",
    });
    const { result } = renderHook(() => useArchitectureIntelligenceActions(ctx));

    let runPromise: Promise<void>;
    act(() => {
      runPromise = result.current.runGoldenTest();
    });

    expect(vi.mocked(ctx.setRunState).mock.calls.some((call) => call[0] === null)).toBe(true);

    await act(async () => {
      resolvePost!({ specialistReviews: [] });
      await runPromise!;
    });
  });
});
