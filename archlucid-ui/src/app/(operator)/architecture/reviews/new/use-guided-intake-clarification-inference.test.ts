import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ActorSet } from "@/types/draft-intake";

const useInferredUniversalIntakeAnswers = vi.fn(() => ({}));

vi.mock("@/lib/guided-intake-clarification-inference-corpus", () => ({
  buildGuidedIntakeClarificationInferenceCorpus: () => "corpus",
}));

vi.mock("@/hooks/use-agent-execution-mode", () => ({
  useAgentExecutionMode: () => ({ isSimulator: false }),
}));

vi.mock("@/hooks/use-inferred-universal-intake-answers", () => ({
  useInferredUniversalIntakeAnswers: (...args: unknown[]) => useInferredUniversalIntakeAnswers(...args),
}));

import { useGuidedIntakeClarificationInference } from "./use-guided-intake-clarification-inference";

const emptyActors: ActorSet = { actors: [] };

describe("useGuidedIntakeClarificationInference", () => {
  it("disables LLM clarification inference when intakeStep deep link skips the clarifications slide", () => {
    useInferredUniversalIntakeAnswers.mockClear();

    renderHook(() =>
      useGuidedIntakeClarificationInference({
        step: 2,
        architectureOverview: "overview",
        systemName: "Sys",
        businessOutcome: "Outcome",
        structuredBrief: {},
        actorSet: emptyActors,
        evidenceFiles: [],
        answers: {},
        onAnswersChange: vi.fn(),
        blocksLlmRephrase: false,
      }),
    );

    expect(useInferredUniversalIntakeAnswers).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });
});
