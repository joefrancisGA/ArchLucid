"use client";

import { useState } from "react";

import { AskAssistantMessageBody } from "@/components/AskAssistantMessageBody";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { DraftIntakeClaimLabel } from "@/components/draft-intake/DraftIntakeClaimLabel";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { reasonDraftRequest } from "@/lib/api/draft-intake-api";
import { isApiRequestError } from "@/lib/api-request-error";
import type { ApiProblemDetails } from "@/lib/api-problem";

const DEFAULT_INTAKE_QUESTION =
  "What gaps or risks do you see in my intent and outcome before I start the architecture run?";

type DraftIntakeReasonTurn = {
  message: string;
  answer: string;
};

export type DraftIntakeReasoningPanelProps = {
  readonly draftId: string;
  readonly disabled?: boolean;
  readonly defaultOpen?: boolean;
};

/**
 * Pre-run Socratic reasoning via POST /v1/architecture/draft/{draftId}/reason (SAQ-013).
 */
export function DraftIntakeReasoningPanel(props: DraftIntakeReasoningPanelProps) {
  const [message, setMessage] = useState(DEFAULT_INTAKE_QUESTION);
  const [conversationThreadId, setConversationThreadId] = useState<string | null>(null);
  const [turns, setTurns] = useState<DraftIntakeReasonTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null>(null);

  const panelDisabled = props.disabled === true || busy;

  async function submitMessage(): Promise<void> {
    const trimmed = message.trim();

    if (trimmed.length === 0 || panelDisabled) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const response = await reasonDraftRequest(props.draftId, trimmed);
      setConversationThreadId(response.conversationThreadId);
      setTurns((previous) => [...previous, { message: trimmed, answer: response.answer }]);
      setMessage("");
    } catch (submitError: unknown) {
      if (isApiRequestError(submitError)) {
        setError({
          message: submitError.message,
          problem: submitError.problem,
          correlationId: submitError.correlationId,
        });
      } else {
        setError({
          message: submitError instanceof Error ? submitError.message : "Reasoning request failed.",
          problem: null,
          correlationId: null,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <CollapsibleSection title="Reason about this draft" defaultOpen={props.defaultOpen === true}>
      <div className="draft-intake-reasoning-panel space-y-4" data-testid="draft-intake-reasoning-panel">
        <p className="m-0 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
          Manifest-free intake reasoning — grounded on your draft document, not a committed golden manifest.
        </p>
        <DraftIntakeClaimLabel surface="llm-intake-reasoning" />

        {conversationThreadId !== null ? (
          <p className="m-0 text-xs text-neutral-500 dark:text-neutral-400">
            Conversation thread: {conversationThreadId}
          </p>
        ) : null}

        {turns.length > 0 ? (
          <ol className="m-0 list-none space-y-4 p-0">
            {turns.map((turn, index) => (
              <li
                key={`${index}-${turn.message.slice(0, 24)}`}
                className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
              >
                <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  You asked
                </p>
                <p className="m-0 text-sm text-neutral-800 dark:text-neutral-200">{turn.message}</p>
                <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Answer
                </p>
                <AskAssistantMessageBody content={turn.answer} />
              </li>
            ))}
          </ol>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor={`draft-intake-reason-${props.draftId}`}>Message</Label>
          <Textarea
            id={`draft-intake-reason-${props.draftId}`}
            rows={4}
            value={message}
            disabled={panelDisabled}
            data-testid="draft-intake-reason-input"
            onChange={(event) => {
              setMessage(event.target.value);
            }}
          />
        </div>

        {error !== null ? (
          <OperatorApiProblem
            problem={error.problem}
            fallbackMessage={error.message}
            correlationId={error.correlationId}
          />
        ) : null}

        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={panelDisabled || message.trim().length === 0}
          data-testid="draft-intake-reason-submit"
          onClick={() => {
            void submitMessage();
          }}
        >
          {busy ? "Reasoning…" : "Ask"}
        </Button>
      </div>
    </CollapsibleSection>
  );
}
