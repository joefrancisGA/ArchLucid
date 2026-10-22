import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AskResponse } from "@/types/conversation";

import { useAskStream } from "./useAskStream";

const askArchLucidStream = vi.fn();

vi.mock("@/lib/api/ask-sse-stream", () => ({
  askArchLucidStream: (...args: unknown[]) => askArchLucidStream(...args),
}));

describe("useAskStream", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("accumulates streamed tokens and clears isStreaming on completion", async () => {
    const done: AskResponse = {
      threadId: "thread-1",
      answer: "Full answer",
      referencedDecisions: [],
      referencedFindings: [],
      referencedArtifacts: [],
    };

    askArchLucidStream.mockImplementation(
      async (
        _payload: unknown,
        handlers: { onToken: (text: string) => void; onDone: (response: AskResponse) => void },
      ) => {
        handlers.onToken("Hel");
        handlers.onToken("lo");
        handlers.onDone(done);

        return done;
      },
    );

    const { result } = renderHook(() => useAskStream());

    await act(async () => {
      const outcome = await result.current.ask({ runId: "run-1", question: "What changed?" });
      expect(outcome.response?.answer).toBe("Full answer");
    });

    await waitFor(() => {
      expect(result.current.tokens).toBe("Hello");
    });

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("surfaces stream errors", async () => {
    askArchLucidStream.mockImplementation(
      async (_payload: unknown, handlers: { onError: (detail: string) => void }) => {
        handlers.onError("stream failed");

        return null;
      },
    );

    const { result } = renderHook(() => useAskStream());

    await act(async () => {
      const outcome = await result.current.ask({ runId: "run-1", question: "Why?" });
      expect(outcome.error).toBe("stream failed");
    });
    expect(result.current.isStreaming).toBe(false);
  });
});
