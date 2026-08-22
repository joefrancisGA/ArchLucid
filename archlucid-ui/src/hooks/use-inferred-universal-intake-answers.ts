import { useCallback, useEffect, useRef, useState } from "react";

import { buildArchitectureIntakeInferenceCorpus } from "@/lib/evidence-readable-text";
import {
  inferUniversalIntakeAnswersFromCorpus,
  mergeInferredUniversalIntakeAnswers,
} from "@/lib/universal-intake-answer-inference";

type UseInferredUniversalIntakeAnswersInput = {
  readonly briefText: string;
  readonly evidenceFiles: readonly File[];
  readonly answers: Readonly<Record<string, string>>;
  readonly onAnswersChange: (answers: Readonly<Record<string, string>>) => void;
};

type UseInferredUniversalIntakeAnswersResult = {
  readonly inferredQuestionKeys: ReadonlySet<string>;
  readonly isExtractingEvidenceText: boolean;
  readonly markQuestionEdited: (questionKey: string) => void;
};

/** Prefills empty L0 clarification answers from brief/evidence text without overwriting operator edits. */
export function useInferredUniversalIntakeAnswers(
  input: UseInferredUniversalIntakeAnswersInput,
): UseInferredUniversalIntakeAnswersResult {
  const [inferredQuestionKeys, setInferredQuestionKeys] = useState<ReadonlySet<string>>(() => new Set());
  const [isExtractingEvidenceText, setIsExtractingEvidenceText] = useState(false);
  const lockedQuestionKeysRef = useRef(new Set<string>());
  const onAnswersChangeRef = useRef(input.onAnswersChange);
  const answersRef = useRef(input.answers);

  onAnswersChangeRef.current = input.onAnswersChange;
  answersRef.current = input.answers;

  useEffect(() => {
    let cancelled = false;

    async function applyInference(): Promise<void> {
      setIsExtractingEvidenceText(true);

      try {
        const corpus = await buildArchitectureIntakeInferenceCorpus({
          briefText: input.briefText,
          evidenceFiles: input.evidenceFiles,
        });

        if (cancelled) {
          return;
        }

        const inferredAnswers = inferUniversalIntakeAnswersFromCorpus(corpus);
        const { mergedAnswers, newlyInferredQuestionKeys } = mergeInferredUniversalIntakeAnswers({
          currentAnswers: answersRef.current,
          inferredAnswers,
          lockedQuestionKeys: lockedQuestionKeysRef.current,
        });

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
        if (!cancelled) {
          setIsExtractingEvidenceText(false);
        }
      }
    }

    void applyInference();

    return () => {
      cancelled = true;
    };
  }, [input.briefText, input.evidenceFiles]);

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
    markQuestionEdited,
  };
}
