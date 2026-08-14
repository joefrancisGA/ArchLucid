"use client";

import { cn } from "@/lib/utils";

import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY, type EnterpriseStatusKind } from "@/lib/design-tokens";
import {
  deriveReplayValidationOutcome,
  replayValidationModeDefinition,
  replayValidationOutcomeLabel,
  sortReplayNotes,
} from "@/lib/replay-validation-workflow";
import type { ReplayResponse } from "@/types/authority";

export type ReplayValidationResultPanelProps = {
  readonly result: ReplayResponse;
};

function outcomeKind(
  outcome: ReturnType<typeof deriveReplayValidationOutcome>,
): EnterpriseStatusKind {
  switch (outcome) {
    case "valid":
      return "ready";
    case "valid_with_warnings":
    case "incomplete":
      return "needs-attention";
    case "invalid":
    case "failed":
      return "blocked";
    case "canceled":
    case null:
      return "neutral";
    default: {
      const exhaustive: never = outcome;
      return exhaustive;
    }
  }
}

export function ReplayValidationResultPanel(props: ReplayValidationResultPanelProps) {
  const { result } = props;
  const outcome = deriveReplayValidationOutcome({ response: result, failure: null });

  return (
    <ClientErrorBoundary title="Validation result failed to render">
      <section
        className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
        data-testid="replay-validation-result-panel"
        aria-live="polite"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>Validation result</h3>
          {outcome !== null ? (
            <StatusTag kind={outcomeKind(outcome)} label={replayValidationOutcomeLabel(outcome)} data-testid="replay-validation-outcome" />
          ) : null}
        </div>

        <dl className={cn("m-0 grid gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
          <div>
            <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Review</dt>
            <dd className="m-0 font-mono">{result.runId}</dd>
          </div>
          <div>
            <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Validation mode</dt>
            <dd className="m-0">{replayValidationModeDefinition(result.mode).title}</dd>
          </div>
          <div>
            <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Validated</dt>
            <dd className="m-0">{new Date(result.replayedUtc).toLocaleString()}</dd>
          </div>
        </dl>

        <div>
          <h4 className={cn("mb-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Consistency checks</h4>
          <dl className={cn("m-0 grid gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
            <div>
              <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Context present</dt>
              <dd className="m-0">{String(result.validation.contextPresent)}</dd>
            </div>
            <div>
              <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Graph present</dt>
              <dd className="m-0">{String(result.validation.graphPresent)}</dd>
            </div>
            <div>
              <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Findings present</dt>
              <dd className="m-0">{String(result.validation.findingsPresent)}</dd>
            </div>
            <div>
              <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Sealed record present</dt>
              <dd className="m-0">{String(result.validation.manifestPresent)}</dd>
            </div>
            <div>
              <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Trace present</dt>
              <dd className="m-0">{String(result.validation.tracePresent)}</dd>
            </div>
            <div>
              <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Artifacts present</dt>
              <dd className="m-0">{String(result.validation.artifactsPresent)}</dd>
            </div>
            <div>
              <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Sealed record hash matches</dt>
              <dd className="m-0">{String(result.validation.manifestHashMatches)}</dd>
            </div>
            <div>
              <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Artifact bundle after validation</dt>
              <dd className="m-0">{String(result.validation.artifactBundlePresentAfterReplay)}</dd>
            </div>
          </dl>
        </div>

        {result.validation.notes.length > 0 ? (
          <div>
            <h4 className={cn("mb-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Validation notes</h4>
            <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
              {sortReplayNotes(result.validation.notes).map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </ClientErrorBoundary>
  );
}
