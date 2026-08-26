"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useMemo, useState } from "react";

import { AskAssistantMessageBody } from "@/components/AskAssistantMessageBody";
import { DisclosureTriangleIndicator } from "@/components/DisclosureTriangleIndicator";
import { DraftIntakeClaimLabel } from "@/components/draft-intake/DraftIntakeClaimLabel";
import { SimulatorModeAiOperationNotice } from "@/components/usability/SimulatorModeAiOperationNotice";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { reasonDraftRequest } from "@/lib/api/draft-intake-api";
import { isApiRequestError } from "@/lib/api-request-error";
import type { ApiProblemDetails } from "@/lib/api-problem";

const DEFAULT_INTAKE_QUESTION =
  "What gaps or risks do you see in my intent and outcome before I start the architecture review?";

const ASSISTANT_NOTES_TITLE = "Intake assistant notes";
const NO_SUGGESTIONS_COPY = "No suggestions right now.";

type DraftIntakeReasonTurn = {
  message: string;
  answer: string;
};

export type DraftIntakeReasoningPanelProps = {
  readonly draftId: string;
  readonly disabled?: boolean;
  readonly defaultOpen?: boolean;
  /** When true, renders as a subsection inside Advanced options (no outer collapsible). */
  readonly embedded?: boolean;
};

function summarizeLatestTurn(turns: DraftIntakeReasonTurn[], includeEmptySummary: boolean): string | null {
  if (turns.length === 0) {
    return includeEmptySummary ? NO_SUGGESTIONS_COPY : null;
  }

  const latest = turns[turns.length - 1];
  const preview = latest.answer.replace(/\s+/g, " ").trim();

  if (preview.length <= 120) {
    return preview;
  }

  return `${preview.slice(0, 117)}…`;
}

/**
 * Pre-run Socratic reasoning via POST /v1/architecture/draft/{draftId}/reason (SAQ-013).
 */
export function DraftIntakeReasoningPanel(props: DraftIntakeReasoningPanelProps) {
  const [panelOpen, setPanelOpen] = useState(props.defaultOpen === true);
  const [message, setMessage] = useState(DEFAULT_INTAKE_QUESTION);
  const [turns, setTurns] = useState<DraftIntakeReasonTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null>(null);

  const panelDisabled = props.disabled === true || busy;
  const showEmptyInSummary = props.embedded !== true && !panelOpen;
  const showEmptyInBody = turns.length === 0 && (props.embedded === true || panelOpen);
  const summaryStatus = useMemo(
    () => summarizeLatestTurn(turns, showEmptyInSummary),
    [turns, showEmptyInSummary],
  );

  async function submitMessage(): Promise<void> {
    const trimmed = message.trim();

    if (trimmed.length === 0 || panelDisabled) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const response = await reasonDraftRequest(props.draftId, trimmed);
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

  const panelContent = (
    <div className="draft-intake-reasoning-panel space-y-4">
      <DraftIntakeClaimLabel surface="llm-intake-reasoning" />

      {turns.length > 0 ? (
        <>
          <SimulatorModeAiOperationNotice testId="draft-intake-reasoning-simulator-notice" />
          <ol className="m-0 list-none space-y-4 p-0">
          {turns.map((turn, index) => (
            <li
              key={`${index}-${turn.message.slice(0, 24)}`}
              className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
            >
              <p className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                You asked
              </p>
              <p className={cn("m-0 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>{turn.message}</p>
              <p className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                Answer
              </p>
              <AskAssistantMessageBody content={turn.answer} />
            </li>
          ))}
        </ol>
        </>
      ) : showEmptyInBody ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>{NO_SUGGESTIONS_COPY}</p>
      ) : null}

      <details className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
        <summary
          className={cn("cursor-pointer select-none font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="draft-intake-reason-follow-up-toggle"
        >
          Ask a follow-up
        </summary>

        <div className="mt-3 space-y-3">
          <div className="space-y-2">
            <Label htmlFor={`draft-intake-reason-${props.draftId}`}>Your question</Label>
            <Textarea
              id={`draft-intake-reason-${props.draftId}`}
              rows={4}
              value={message}
              disabled={panelDisabled}
              placeholder="Ask ArchLucid to clarify a gap or risk in your draft answer…"
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
            variant="outline"
            size="sm"
            disabled={panelDisabled || message.trim().length === 0}
            data-testid="draft-intake-reason-submit"
            onClick={() => {
              void submitMessage();
            }}
          >
            {busy ? "Asking…" : "Ask intake assistant"}
          </Button>
        </div>
      </details>
    </div>
  );

  if (props.embedded === true) {
    return (
      <div className="draft-intake-reasoning-embedded space-y-3" data-testid="draft-intake-reasoning-panel">
        <div>
          <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{ASSISTANT_NOTES_TITLE}</p>
          {summaryStatus !== null ? (
            <p
              className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="draft-intake-reasoning-summary"
            >
              {summaryStatus}
            </p>
          ) : null}
        </div>
        {panelContent}
      </div>
    );
  }

  return (
    <details
      className="group mb-6 rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid="draft-intake-reasoning-panel"
      open={panelOpen}
      onToggle={(event) => {
        setPanelOpen((event.currentTarget as HTMLDetailsElement).open);
      }}
    >
      <summary className="flex cursor-pointer select-none list-none items-start gap-2 marker:content-none [&::-webkit-details-marker]:hidden">
        <DisclosureTriangleIndicator className="mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <span className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{ASSISTANT_NOTES_TITLE}</span>
          {summaryStatus !== null ? (
            <span
              className={cn("font-normal text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="draft-intake-reasoning-summary"
            >
              {summaryStatus}
            </span>
          ) : null}
        </div>
      </summary>

      {panelOpen ? <div className="mt-3">{panelContent}</div> : null}
    </details>
  );
}
