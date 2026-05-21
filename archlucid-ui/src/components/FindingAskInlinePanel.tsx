"use client";

import { useState } from "react";

import { AskAssistantMessageBody } from "@/components/AskAssistantMessageBody";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { askAboutFinding } from "@/lib/api/finding-ask-api";
import { isApiRequestError } from "@/lib/api-request-error";
import type { ApiProblemDetails } from "@/lib/api-problem";

const DEFAULT_FINDING_QUESTION =
  "Why is this a finding, what evidence supports it, and what is the smallest concrete fix?";

type FindingAskInlinePanelProps = {
  readonly findingId: string;
  readonly defaultOpen?: boolean;
};

type AskTurn = {
  question: string;
  answer: string;
};

/**
 * Inline grounded Q&A for a single finding via POST /v1/architecture/finding/{findingId}/ask.
 */
export function FindingAskInlinePanel(props: FindingAskInlinePanelProps) {
  const [question, setQuestion] = useState(DEFAULT_FINDING_QUESTION);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [turns, setTurns] = useState<AskTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null>(null);

  async function submitQuestion(): Promise<void> {
    const trimmed = question.trim();

    if (trimmed.length === 0 || busy) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const response = await askAboutFinding(props.findingId, {
        question: trimmed,
        threadId: threadId ?? undefined,
      });
      setThreadId(response.threadId);
      setTurns((prev) => [...prev, { question: trimmed, answer: response.answer }]);
      setQuestion("");
    } catch (e: unknown) {
      if (isApiRequestError(e)) {
        setError({
          message: e.message,
          problem: e.problem,
          correlationId: e.correlationId,
        });
      } else {
        setError({
          message: e instanceof Error ? e.message : "Ask request failed.",
          problem: null,
          correlationId: null,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <CollapsibleSection title="Ask about this finding" defaultOpen={props.defaultOpen === true}>
      <div className="space-y-4">
          {turns.length > 0 ? (
            <ol className="m-0 list-none space-y-4 p-0">
              {turns.map((turn, index) => (
                <li
                  key={`${index}-${turn.question.slice(0, 24)}`}
                  className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
                >
                  <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    You asked
                  </p>
                  <p className="m-0 text-sm text-neutral-800 dark:text-neutral-200">{turn.question}</p>
                  <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Answer
                  </p>
                  <AskAssistantMessageBody content={turn.answer} />
                </li>
              ))}
            </ol>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor={`finding-ask-question-${props.findingId}`}>Question</Label>
            <Textarea
              id={`finding-ask-question-${props.findingId}`}
              rows={4}
              value={question}
              disabled={busy}
              onChange={(e) => {
                setQuestion(e.target.value);
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

        <Button type="button" variant="primary" size="sm" disabled={busy || question.trim().length === 0} onClick={() => void submitQuestion()}>
          {busy ? "Asking…" : "Ask"}
        </Button>
      </div>
    </CollapsibleSection>
  );
}
