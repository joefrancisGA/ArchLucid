"use client";

import { useMemo } from "react";

import { useAgentExecutionMode } from "@/hooks/use-agent-execution-mode";
import { useInferredUniversalIntakeAnswers } from "@/hooks/use-inferred-universal-intake-answers";
import type { ArchitectureDraftStructuredBriefState } from "@/lib/architecture/architecture-draft-structured-brief";
import { buildGuidedIntakeClarificationInferenceCorpus } from "@/lib/guided-intake-clarification-inference-corpus";
import type { ActorSet } from "@/types/draft-intake";

type UseGuidedIntakeClarificationInferenceInput = {
  readonly step: number;
  readonly architectureOverview: string;
  readonly systemName: string;
  readonly businessOutcome: string;
  readonly structuredBrief: ArchitectureDraftStructuredBriefState;
  readonly actorSet: ActorSet;
  readonly evidenceFiles: readonly File[];
  readonly answers: Readonly<Record<string, string>>;
  readonly onAnswersChange: (answers: Readonly<Record<string, string>>) => void;
  readonly blocksLlmRephrase: boolean;
};

/** Suggests L0 clarification answers from the guided intake architecture brief on step 1. */
export function useGuidedIntakeClarificationInference(input: UseGuidedIntakeClarificationInferenceInput) {
  const { isSimulator } = useAgentExecutionMode();
  const clarificationInferenceCorpus = useMemo(
    () =>
      buildGuidedIntakeClarificationInferenceCorpus({
        architectureOverview: input.architectureOverview,
        systemName: input.systemName,
        businessOutcome: input.businessOutcome,
        structuredBrief: input.structuredBrief,
        actorSet: input.actorSet,
      }),
    [
      input.actorSet,
      input.architectureOverview,
      input.businessOutcome,
      input.structuredBrief,
      input.systemName,
    ],
  );

  return useInferredUniversalIntakeAnswers({
    briefText: clarificationInferenceCorpus,
    evidenceFiles: [...input.evidenceFiles],
    answers: input.answers,
    onAnswersChange: input.onAnswersChange,
    blocksLlmRephrase: input.blocksLlmRephrase,
    isSimulator,
    enabled: input.step === 1,
  });
}
