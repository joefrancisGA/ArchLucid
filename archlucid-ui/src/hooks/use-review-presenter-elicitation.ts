"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import {
  answerDraftQuestion,
  getDraftQuestions,
  skipDraftQuestion,
} from "@/lib/api/draft-intake-api";
import { reasonDraftRequest } from "@/lib/api/draft-intake-api-lifecycle";
import type { DraftElicitationQuestion } from "@/types/draft-intake-workflow";

const DRAFT_QUESTIONS_QUERY_KEY = "draft-questions";

export type UseReviewPresenterElicitationResult = {
  readonly primaryQuestion: DraftElicitationQuestion | null;
  readonly pendingQuestionCount: number;
  readonly title: string;
  readonly readyToFinalize: boolean;
  readonly busy: boolean;
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

/** Loads draft MUST/SHOULD questions for Working presenter elicitation (FD-01). */
export function useReviewPresenterElicitation(
  draftId: string | null | undefined,
): UseReviewPresenterElicitationResult {
  const trimmedDraftId = draftId?.trim() ?? "";
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

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
  }, [queryClient, trimmedDraftId]);

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
    await runMutation(() =>
      answerDraftQuestion(trimmedDraftId, primaryQuestion!.questionKey, "Yes"),
    );
  }, [primaryQuestion, runMutation, trimmedDraftId]);

  const reject = useCallback(async (): Promise<void> => {
    await runMutation(() => skipDraftQuestion(trimmedDraftId, primaryQuestion!.questionKey));
  }, [primaryQuestion, runMutation, trimmedDraftId]);

  const askAnother = useCallback(async (): Promise<void> => {
    await runMutation(() =>
      reasonDraftRequest(trimmedDraftId, "Please ask another clarifying question for the room."),
    );
  }, [runMutation, trimmedDraftId]);

  const readyToFinalize = trimmedDraftId.length === 0 || (query.isSuccess && primaryQuestion === null);

  const title = primaryQuestion?.prompt ?? "Ready to finalize";

  return {
    primaryQuestion,
    pendingQuestionCount: pendingMust.length,
    title,
    readyToFinalize,
    busy,
    confirm,
    reject,
    askAnother,
  };
}
