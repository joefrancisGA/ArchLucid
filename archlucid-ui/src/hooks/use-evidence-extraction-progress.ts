"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { EvidenceExtractionStageId } from "@/lib/evidence/evidence-extraction-progress-stages";
import {
  evidenceExtractionStageIndex,
  firstEvidenceExtractionStageId,
  resolveEvidenceExtractionStages,
} from "@/lib/evidence/evidence-extraction-progress-stages";

export type EvidenceExtractionCompletion = {
  readonly extractedCharacterCount: number;
  readonly suggestedAnswerCount: number;
};

export type EvidenceExtractionProgressBeginInput = {
  readonly documentNames: readonly string[];
  readonly hasBinaryDocuments: boolean;
  readonly canDraftClarificationAnswers: boolean;
};

export type EvidenceExtractionProgressPhase = "idle" | "processing" | "complete";

const EVIDENCE_EXTRACTION_COMPLETE_DISMISS_MS = 4_000;

export function useEvidenceExtractionProgress() {
  const [phase, setPhase] = useState<EvidenceExtractionProgressPhase>("idle");
  const [documentNames, setDocumentNames] = useState<readonly string[]>([]);
  const [activeStageId, setActiveStageId] = useState<EvidenceExtractionStageId | null>(null);
  const [completion, setCompletion] = useState<EvidenceExtractionCompletion | null>(null);
  const [hasBinaryDocuments, setHasBinaryDocuments] = useState(false);
  const [canDraftClarificationAnswers, setCanDraftClarificationAnswers] = useState(false);
  const extractedCharacterCountRef = useRef(0);
  const dismissTimerIdRef = useRef<number | null>(null);

  const clearDismissTimer = useCallback(() => {
    if (dismissTimerIdRef.current !== null) {
      window.clearTimeout(dismissTimerIdRef.current);
      dismissTimerIdRef.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearDismissTimer();
    setPhase("idle");
    setDocumentNames([]);
    setActiveStageId(null);
    setCompletion(null);
    setHasBinaryDocuments(false);
    setCanDraftClarificationAnswers(false);
    extractedCharacterCountRef.current = 0;
  }, [clearDismissTimer]);

  useEffect(() => {
    return () => {
      clearDismissTimer();
    };
  }, [clearDismissTimer]);

  const begin = useCallback(
    (input: EvidenceExtractionProgressBeginInput) => {
      clearDismissTimer();
      extractedCharacterCountRef.current = 0;
      setDocumentNames(input.documentNames);
      setHasBinaryDocuments(input.hasBinaryDocuments);
      setCanDraftClarificationAnswers(input.canDraftClarificationAnswers);
      setCompletion(null);
      setPhase("processing");

      const stages = resolveEvidenceExtractionStages({
        hasBinaryDocuments: input.hasBinaryDocuments,
        canDraftClarificationAnswers: input.canDraftClarificationAnswers,
      });
      setActiveStageId(firstEvidenceExtractionStageId(stages));
    },
    [clearDismissTimer],
  );

  const reportStage = useCallback((stageId: EvidenceExtractionStageId) => {
    setActiveStageId(stageId);
  }, []);

  const reportExtractedCharacters = useCallback((characterCount: number) => {
    extractedCharacterCountRef.current += characterCount;
  }, []);

  const complete = useCallback(
    (input: { readonly suggestedAnswerCount: number }) => {
      setCompletion({
        extractedCharacterCount: extractedCharacterCountRef.current,
        suggestedAnswerCount: input.suggestedAnswerCount,
      });
      setPhase("complete");
      clearDismissTimer();
      dismissTimerIdRef.current = window.setTimeout(() => {
        dismissTimerIdRef.current = null;
        dismiss();
      }, EVIDENCE_EXTRACTION_COMPLETE_DISMISS_MS);
    },
    [clearDismissTimer, dismiss],
  );

  const stages = useMemo(
    () =>
      resolveEvidenceExtractionStages({
        hasBinaryDocuments,
        canDraftClarificationAnswers,
      }),
    [canDraftClarificationAnswers, hasBinaryDocuments],
  );

  const activeStageIndex = useMemo(
    () => evidenceExtractionStageIndex(stages, activeStageId),
    [activeStageId, stages],
  );

  return {
    phase,
    stages,
    activeStageId,
    activeStageIndex,
    documentNames,
    completion,
    begin,
    reportStage,
    reportExtractedCharacters,
    complete,
    dismiss,
  };
}

export type EvidenceExtractionProgress = ReturnType<typeof useEvidenceExtractionProgress>;
