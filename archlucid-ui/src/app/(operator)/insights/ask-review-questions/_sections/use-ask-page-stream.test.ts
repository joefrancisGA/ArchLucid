import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const askStream = vi.fn();

vi.mock("@/hooks/useAskStream", () => ({
  useAskStream: () => ({
    tokens: "",
    isStreaming: false,
    ask: askStream,
    reset: vi.fn(),
  }),
}));

import { useAskPageStream } from "./use-ask-page-stream";

describe("useAskPageStream retrievalDegraded", () => {
  beforeEach(() => {
    askStream.mockReset();
  });

  it("leaves retrievalDegraded unchanged when the stream omits the flag", async () => {
    const setRetrievalDegraded = vi.fn();

    askStream.mockResolvedValue({
      response: {
        threadId: "thread-1",
        referencedFindings: [],
        referencedDecisions: [],
        referencedArtifacts: [],
      },
      error: null,
    });

    const { result } = renderHook(() =>
      useAskPageStream({
        selectedThreadId: "",
        runId: "run-1",
        baseRunId: "",
        targetRunId: "",
        question: "What changed?",
        setQuestion: vi.fn(),
        setSelectedThreadId: vi.fn(),
        setMessages: vi.fn((updater) => {
          if (typeof updater === "function") {
            updater([]);
          }
        }),
        setActionFailure: vi.fn(),
        setRetrievalDegraded,
        setLastAskReferencedFindings: vi.fn(),
        setLastAskReferencedDecisions: vi.fn(),
        setLastAskReferencedArtifacts: vi.fn(),
        loadThreads: vi.fn().mockResolvedValue(undefined),
        loadMessages: vi.fn().mockResolvedValue(undefined),
        loading: false,
        setLoading: vi.fn(),
      }),
    );

    await act(async () => {
      await result.current.onAsk("What changed?");
    });

    expect(setRetrievalDegraded).toHaveBeenCalledWith(null);
  });

  it("sets retrievalDegraded when the stream returns true", async () => {
    const setRetrievalDegraded = vi.fn();

    askStream.mockResolvedValue({
      response: {
        threadId: "thread-1",
        retrievalDegraded: true,
        referencedFindings: [],
        referencedDecisions: [],
        referencedArtifacts: [],
      },
      error: null,
    });

    const { result } = renderHook(() =>
      useAskPageStream({
        selectedThreadId: "",
        runId: "run-1",
        baseRunId: "",
        targetRunId: "",
        question: "What changed?",
        setQuestion: vi.fn(),
        setSelectedThreadId: vi.fn(),
        setMessages: vi.fn((updater) => {
          if (typeof updater === "function") {
            updater([]);
          }
        }),
        setActionFailure: vi.fn(),
        setRetrievalDegraded,
        setLastAskReferencedFindings: vi.fn(),
        setLastAskReferencedDecisions: vi.fn(),
        setLastAskReferencedArtifacts: vi.fn(),
        loadThreads: vi.fn().mockResolvedValue(undefined),
        loadMessages: vi.fn().mockResolvedValue(undefined),
        loading: false,
        setLoading: vi.fn(),
      }),
    );

    await act(async () => {
      await result.current.onAsk("What changed?");
    });

    expect(setRetrievalDegraded).toHaveBeenCalledWith(true);
  });
});
