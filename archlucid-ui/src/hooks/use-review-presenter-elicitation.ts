"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import {
  answerDraftQuestion,
  getDraftQuestions,
} from "@/lib/api/draft-intake-api";
import { reasonDraftRequest } from "@/lib/api/draft-intake-api-lifecycle";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { DraftElicitationQuestion } from "@/types/draft-intake-workflow";
import type { TransparencyTrail } from "@/types/feasibility-verdict";
import { deriveFinalizeQualityScorecardInput } from "@/lib/review-quality/finalize-quality-scorecard-from-findings";
import { evaluateFinalizeQualityScorecard } from "@/lib/review-quality/finalize-quality-scorecard";

const DRAFT_QUESTIONS_QUERY_KEY = "draft-questions";

export type PresenterRecordedAssertedEntry = {
  readonly questionKey: string;
  readonly answer: string;
  readonly responderLabel: string;
};

export type UseReviewPresenterElicitationResult = {
  readonly primaryQuestion: DraftElicitationQuestion | null;
  readonly pendingQuestionCount: number;
  readonly title: string;
  readonly readyToFinalize: boolean;
  readonly busy: boolean;
  readonly transparencyTrail: TransparencyTrail | null;
  readonly lastRecordedEntry: PresenterRecordedAssertedEntry | null;
  readonly confirm: () => Promise<void>;
  readonly reject: () => Promise<void>;
  readonly askAnother: () => Promise<void>;
};

function selectPrimaryPendingQuestion(
  pendingMust: readonly DraftElicitationQuestion[],
  allQuestions: readonly DraftElicitationQuestion[],
): DraftElicitationQuestion | null {
  if (pendingMust.length > 0) {
    return pendingMust[0] ?? null;
  }

  return allQuestions[0] ?? null;
}

/** Loads draft MUST/SHOULD questions for Working presenter elicitation (FD-01 / PC-09). */
export function useReviewPresenterElicitation(
  draftId: string | null | undefined,
  runId?: string | null,
): UseReviewPresenterElicitationResult {
  const trimmedDraftId = draftId?.trim() ?? "";
  const trimmedRunId = runId?.trim() ?? "";
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [transparencyTrail, setTransparencyTrail] = useState<TransparencyTrail | null>(null);
  const [lastRecordedEntry, setLastRecordedEntry] = useState<PresenterRecordedAssertedEntry | null>(null);

  const query = useQuery({
    queryKey: [DRAFT_QUESTIONS_QUERY_KEY, trimmedDraftId],
    queryFn: () => getDraftQuestions(trimmedDraftId),
    enabled: trimmedDraftId.length > 0,
    staleTime: 15_000,
  });

  const pendingMust = query.data?.selection.pendingMustQuestions ?? [];
  const allQuestions = query.data?.selection.allQuestions ?? [];
  const primaryQuestion = useMemo(
    () => selectPrimaryPendingQuestion(pendingMust, allQuestions),
    [allQuestions, pendingMust],
  );

  const invalidate = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: [DRAFT_QUESTIONS_QUERY_KEY, trimmedDraftId] });

    if (trimmedRunId.length > 0) {
      await queryClient.invalidateQueries({ queryKey: operatorQueryKeys.runDetailWorkspaceContextBundle(trimmedRunId) });
      await queryClient.invalidateQueries({ queryKey: operatorQueryKeys.runSummary(trimmedRunId) });
    }
  }, [queryClient, trimmedDraftId, trimmedRunId]);

  const recordPresenterAnswer = useCallback(
    async (answer: string): Promise<void> => {
      if (trimmedDraftId.length === 0 || primaryQuestion === null) {
        return;
      }

      const response = await answerDraftQuestion(trimmedDraftId, primaryQuestion.questionKey, answer, {
        presenterCapture: true,
        responderLabel: "Room",
      });

      const trail = response.document?.transparencyTrail ?? null;
      setTransparencyTrail(trail);
      setLastRecordedEntry({
        questionKey: primaryQuestion.questionKey,
        answer,
        responderLabel: "Room",
      });
    },
    [primaryQuestion, trimmedDraftId],
  );

  const runMutation = useCallback(
    async (action: () => Promise<unknown>): Promise<void> => {
      if (trimmedDraftId.length === 0 || primaryQuestion === null) {
        return;
      }

      setBusy(true);

      try {
        await action();
        await invalidate();
      } finally {
        setBusy(false);
      }
    },
    [invalidate, primaryQuestion, trimmedDraftId],
  );

  const confirm = useCallback(async (): Promise<void> => {
    await runMutation(() => recordPresenterAnswer("Yes"));
  }, [recordPresenterAnswer, runMutation]);

  const reject = useCallback(async (): Promise<void> => {
    await runMutation(() => recordPresenterAnswer("No"));
  }, [recordPresenterAnswer, runMutation]);

  const askAnother = useCallback(async (): Promise<void> => {
    await runMutation(() =>
      reasonDraftRequest(trimmedDraftId, "Please ask another clarifying question for the room."),
    );
  }, [runMutation, trimmedDraftId]);

  const readyToFinalize = trimmedDraftId.length === 0 || (query.isSuccess && primaryQuestion === null);

  const title = primaryQuestion?.prompt ?? "Ready to finalize";

  const effectiveTrail = transparencyTrail;

  return {
    primaryQuestion,
    pendingQuestionCount: pendingMust.length,
    title,
    readyToFinalize,
    busy,
    transparencyTrail: effectiveTrail,
    lastRecordedEntry,
    confirm,
    reject,
    askAnother,
  };
}

/** Test helper: finalize scorecard sees presenter-asserted answers in the synced trail. */
export function presenterTrailAllowsFinalize(trail: TransparencyTrail | null | undefined): boolean {
  const input = deriveFinalizeQualityScorecardInput([], 0, {
    transparencyTrail: trail,
  });
  const scorecard = evaluateFinalizeQualityScorecard(input);

  return !scorecard.blockingReasons.some((reason) => reason.includes("transparency trail"));
}

export { listPresenterAssertedAnswerEntries } from "@/lib/reviews/review-presenter-asserted-trail";
