"use client";

import { useCallback, useEffect, useState } from "react";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { useNavCallerAuthorityRank } from "@/components/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { getFindingLlmAudit, postFindingFeedback } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import type { FindingLlmAudit } from "@/types/explanation";

export type FindingExplainPanelProps = {
  runId: string;
  findingId: string;
};

/**
 * Redacted LLM prompt/completion audit for one finding, plus thumbs feedback (Execute). Deterministic trace lives in
 * `FindingExplainabilityDialog` / `GET …/explainability`.
 */
export function FindingExplainPanel({ runId, findingId }: FindingExplainPanelProps) {
  const rank = useNavCallerAuthorityRank();
  const [audit, setAudit] = useState<FindingLlmAudit | null>(null);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (findingId.trim().length === 0) {
      return;
    }

    setLoading(true);
    setFailure(null);
    setFeedbackNote(null);

    try {
      const a = await getFindingLlmAudit(runId, findingId.trim());
      setAudit(a);
    } catch (err) {
      setFailure(toApiLoadFailure(err));
    } finally {
      setLoading(false);
    }
  }, [findingId, runId]);

  useEffect(() => {
    if (rank < AUTHORITY_RANK.ReadAuthority) {
      return;
    }

    void load();
  }, [load, rank]);

  if (rank < AUTHORITY_RANK.ReadAuthority) {
    return (
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Sign in with Read authority or higher to view redacted LLM audit text for this finding.
      </p>
    );
  }

  const canVote = rank >= AUTHORITY_RANK.ExecuteAuthority;

  return (
    <div className="space-y-4 border-t border-neutral-200 pt-4 dark:border-neutral-700">
      <h4 className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Explain this finding (LLM audit)</h4>
      <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
        Deny-list redacted prompts and completion. Pair with the deterministic trace above (
        <code className="rounded bg-neutral-200 px-1 text-[0.7rem] dark:bg-neutral-800">…/explainability</code>
        ).
      </p>

      {loading ? (
        <OperatorLoadingNotice>
          <strong>Loading LLM audit…</strong>
        </OperatorLoadingNotice>
      ) : null}

      {failure !== null ? (
        <OperatorApiProblem
          problem={failure.problem}
          fallbackMessage={failure.message}
          correlationId={failure.correlationId}
        />
      ) : null}

      {!loading && failure === null && audit !== null ? (
        <div className="space-y-2">
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            System prompt (redacted) · trace {audit.traceId}
          </p>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-neutral-100 p-2 text-xs dark:bg-neutral-900">
            {audit.systemPromptRedacted.trim().length > 0 ? audit.systemPromptRedacted : "(empty)"}
          </pre>
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            User prompt (redacted)
          </p>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-neutral-100 p-2 text-xs dark:bg-neutral-900">
            {audit.userPromptRedacted.trim().length > 0 ? audit.userPromptRedacted : "(empty)"}
          </pre>
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            LLM completion (redacted)
          </p>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-neutral-100 p-2 text-xs dark:bg-neutral-900">
            {audit.rawResponseRedacted.trim().length > 0 ? audit.rawResponseRedacted : "(empty)"}
          </pre>
          <p className="m-0 text-xs text-neutral-500 dark:text-neutral-400">
            Model: {audit.modelDeploymentName ?? "—"} · Agent: {audit.agentType}
          </p>
        </div>
      ) : null}

      {canVote ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Was this finding helpful?</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={feedbackBusy}
            onClick={() => {
              void (async () => {
                setFeedbackBusy(true);
                setFeedbackNote(null);

                try {
                  await postFindingFeedback(runId, findingId.trim(), 1);
                  setFeedbackNote("Thanks — feedback recorded.");
                } catch (e) {
                  setFeedbackNote(toApiLoadFailure(e).message);
                } finally {
                  setFeedbackBusy(false);
                }
              })();
            }}
          >
            Thumbs up
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={feedbackBusy}
            onClick={() => {
              void (async () => {
                setFeedbackBusy(true);
                setFeedbackNote(null);

                try {
                  await postFindingFeedback(runId, findingId.trim(), -1);
                  setFeedbackNote("Thanks — feedback recorded.");
                } catch (e) {
                  setFeedbackNote(toApiLoadFailure(e).message);
                } finally {
                  setFeedbackBusy(false);
                }
              })();
            }}
          >
            Thumbs down
          </Button>
          {feedbackNote !== null ? <span className="text-xs text-neutral-600 dark:text-neutral-400">{feedbackNote}</span> : null}
        </div>
      ) : (
        <p className="m-0 text-xs text-neutral-500 dark:text-neutral-400">
          Thumbs feedback requires Execute authority or higher (API-enforced).
        </p>
      )}
    </div>
  );
}
