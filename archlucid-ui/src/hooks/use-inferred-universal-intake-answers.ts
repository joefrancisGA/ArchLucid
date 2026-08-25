import { useCallback, useEffect, useRef, useState } from "react";

import {
  buildClarificationRephraseItems,
  mergeRephrasedClarificationAnswers,
  rephraseClarificationAnswersFromExtractedText,
} from "@/lib/api/clarification-answer-rephrase-api";
import { ARCHITECTURE_CREATION_UNIVERSAL_QUESTIONS } from "@/lib/architecture/architecture-creation-question-definition";
import { buildArchitectureIntakeInferenceCorpus } from "@/lib/evidence-readable-text";
import {
  UNIVERSAL_INTAKE_INFERENCE_MIN_CORPUS_CHARS,
  canSuggestUniversalIntakeAnswersFromEvidence,
  inferUniversalIntakeAnswersFromCorpus,
  mergeInferredUniversalIntakeAnswers,
} from "@/lib/universal-intake-answer-inference";

type UseInferredUniversalIntakeAnswersInput = {
  readonly briefText: string;
  readonly evidenceFiles: readonly File[];
  readonly answers: Readonly<Record<string, string>>;
  readonly onAnswersChange: (answers: Readonly<Record<string, string>>) => void;
  readonly blocksLlmRephrase?: boolean;
};

type UseInferredUniversalIntakeAnswersResult = {
  readonly inferredQuestionKeys: ReadonlySet<string>;
  readonly isExtractingEvidenceText: boolean;
  readonly clarificationSuggestionsUnavailable: boolean;
  readonly canSuggestFromEvidence: boolean;
  readonly suggestAnswersFromEvidence: () => void;
  readonly markQuestionEdited: (questionKey: string) => void;
};

/** Prefills empty L0 clarification answers from brief/evidence text without overwriting operator edits. */
export function useInferredUniversalIntakeAnswers(
  input: UseInferredUniversalIntakeAnswersInput,
): UseInferredUniversalIntakeAnswersResult {
  const [inferredQuestionKeys, setInferredQuestionKeys] = useState<ReadonlySet<string>>(() => new Set());
  const [isExtractingEvidenceText, setIsExtractingEvidenceText] = useState(false);
  const [clarificationSuggestionsUnavailable, setClarificationSuggestionsUnavailable] = useState(false);
  const lockedQuestionKeysRef = useRef(new Set<string>());
  const onAnswersChangeRef = useRef(input.onAnswersChange);
  const answersRef = useRef(input.answers);
  const inputRef = useRef(input);

  onAnswersChangeRef.current = input.onAnswersChange;
  answersRef.current = input.answers;
  inputRef.current = input;

  const canSuggestFromEvidence = canSuggestUniversalIntakeAnswersFromEvidence({
    briefText: input.briefText,
    evidenceFiles: input.evidenceFiles,
  });

  const applyInference = useCallback(async (): Promise<void> => {
    const currentInput = inputRef.current;
    setIsExtractingEvidenceText(true);

    try {
      const corpus = await buildArchitectureIntakeInferenceCorpus({
        briefText: currentInput.briefText,
        evidenceFiles: currentInput.evidenceFiles,
      });

      const hasInferenceSource =
        currentInput.evidenceFiles.length > 0
        || currentInput.briefText.trim().length >= UNIVERSAL_INTAKE_INFERENCE_MIN_CORPUS_CHARS;

      const inferredAnswers = inferUniversalIntakeAnswersFromCorpus(corpus);
      let answersToApply = inferredAnswers;

      if (
        currentInput.blocksLlmRephrase !== true
        && Object.keys(inferredAnswers).length > 0
      ) {
        const rephraseItems = buildClarificationRephraseItems({
          inferredAnswers,
          questions: ARCHITECTURE_CREATION_UNIVERSAL_QUESTIONS,
        });

        if (rephraseItems.length > 0) {
          try {
            const rephrased = await rephraseClarificationAnswersFromExtractedText({ items: rephraseItems });
            answersToApply = mergeRephrasedClarificationAnswers({
              currentAnswers: answersRef.current,
              inferredAnswers,
              rephrasedAnswers: rephrased.rephrasedAnswers,
              lockedQuestionKeys: lockedQuestionKeysRef.current,
            });
          }
          catch {
            // Keep deterministic extracted answers when the advisory rephrase endpoint is unavailable.
          }
        }
      }

      const { mergedAnswers, newlyInferredQuestionKeys } = mergeInferredUniversalIntakeAnswers({
        currentAnswers: answersRef.current,
        inferredAnswers: answersToApply,
        lockedQuestionKeys: lockedQuestionKeysRef.current,
      });

      setClarificationSuggestionsUnavailable(
        hasInferenceSource
          && corpus.trim().length >= UNIVERSAL_INTAKE_INFERENCE_MIN_CORPUS_CHARS
          && Object.keys(inferredAnswers).length === 0,
      );

      if (newlyInferredQuestionKeys.length === 0) {
        return;
      }

      onAnswersChangeRef.current(mergedAnswers);
      setInferredQuestionKeys((current) => {
        const next = new Set(current);

        for (const questionKey of newlyInferredQuestionKeys) {
          next.add(questionKey);
        }

        return next;
      });
    }
    finally {
      setIsExtractingEvidenceText(false);
    }
  }, []);

  useEffect(() => {
    if (!canSuggestFromEvidence) {
      setClarificationSuggestionsUnavailable(false);

      return;
    }

    void applyInference();
  }, [applyInference, canSuggestFromEvidence, input.briefText, input.blocksLlmRephrase, input.evidenceFiles]);

  const suggestAnswersFromEvidence = useCallback(() => {
    if (!canSuggestFromEvidence || isExtractingEvidenceText) {
      return;
    }

    void applyInference();
  }, [applyInference, canSuggestFromEvidence, isExtractingEvidenceText]);

  const markQuestionEdited = useCallback((questionKey: string) => {
    lockedQuestionKeysRef.current.add(questionKey);
    setInferredQuestionKeys((current) => {
      if (!current.has(questionKey)) {
        return current;
      }

      const next = new Set(current);
      next.delete(questionKey);

      return next;
    });
  }, []);

  return {
    inferredQuestionKeys,
    isExtractingEvidenceText,
    clarificationSuggestionsUnavailable,
    canSuggestFromEvidence,
    suggestAnswersFromEvidence,
    markQuestionEdited,
  };
}
