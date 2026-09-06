import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";

import {
  listPresenterAssertedAnswerEntries,
  presenterTrailAllowsFinalize,
  useReviewPresenterElicitation,
} from "@/hooks/use-review-presenter-elicitation";

const answerDraftQuestion = vi.fn();
const getDraftQuestions = vi.fn();
const reasonDraftRequest = vi.fn();

vi.mock("@/lib/api/draft-intake-api", () => ({
  answerDraftQuestion: (...args: unknown[]) => answerDraftQuestion(...args),
  getDraftQuestions: (...args: unknown[]) => getDraftQuestions(...args),
  skipDraftQuestion: vi.fn(),
}));

vi.mock("@/lib/api/draft-intake-api-lifecycle", () => ({
  reasonDraftRequest: (...args: unknown[]) => reasonDraftRequest(...args),
}));

describe("useReviewPresenterElicitation (PC-09)", () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient.clear();
    answerDraftQuestion.mockReset();
    getDraftQuestions.mockReset();
    getDraftQuestions.mockResolvedValue({
      selection: {
        pendingMustQuestions: [
          {
            questionKey: "latency",
            prompt: "Is latency acceptable?",
            tier: "MUST",
            answerKind: "YesNo",
            source: "L0Universal",
            ruleKeys: [],
          },
        ],
        allQuestions: [],
        requiredMustQuestionKeys: ["latency"],
      },
    });
  });

  it("records presenter yes answers as asserted trail entries", async () => {
    answerDraftQuestion.mockResolvedValue({
      document: {
        transparencyTrail: {
          asserted: [
            {
              key: "answer.latency",
              value: "Yes",
              questionId: "latency",
              responderLabel: "Room",
            },
          ],
          inferred: [],
          skipped: [],
        },
      },
    });

    const { result } = renderHook(() => useReviewPresenterElicitation("draft-hex", "run-1"), { wrapper });

    await waitFor(() => {
      expect(result.current.primaryQuestion?.questionKey).toBe("latency");
    });

    await act(async () => {
      await result.current.confirm();
    });

    expect(answerDraftQuestion).toHaveBeenCalledWith("draft-hex", "latency", "Yes", {
      presenterCapture: true,
      responderLabel: "Room",
    });
    expect(result.current.lastRecordedEntry).toEqual({
      questionKey: "latency",
      answer: "Yes",
      responderLabel: "Room",
    });
    expect(listPresenterAssertedAnswerEntries(result.current.transparencyTrail)).toHaveLength(1);
    expect(presenterTrailAllowsFinalize(result.current.transparencyTrail)).toBe(true);
  });

  it("records presenter no answers as asserted instead of skip", async () => {
    answerDraftQuestion.mockResolvedValue({
      document: {
        transparencyTrail: {
          asserted: [{ key: "answer.latency", value: "No", questionId: "latency", responderLabel: "Room" }],
          inferred: [],
          skipped: [],
        },
      },
    });

    const { result } = renderHook(() => useReviewPresenterElicitation("draft-hex"), { wrapper });

    await waitFor(() => {
      expect(result.current.primaryQuestion?.questionKey).toBe("latency");
    });

    await act(async () => {
      await result.current.reject();
    });

    expect(answerDraftQuestion).toHaveBeenCalledWith("draft-hex", "latency", "No", {
      presenterCapture: true,
      responderLabel: "Room",
    });
  });
});
