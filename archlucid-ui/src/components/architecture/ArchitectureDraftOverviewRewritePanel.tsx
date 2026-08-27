"use client";

import { useState } from "react";

import { AiBudgetSpendNotice } from "@/components/ai-budget/AiBudgetSpendNotice";
import { ArchitectureManifestUnifiedDiffView } from "@/components/compare/ArchitectureManifestUnifiedDiffView";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { SimulatorModeAiOperationNotice } from "@/components/usability/SimulatorModeAiOperationNotice";
import { Button } from "@/components/ui/button";
import {
  ARCHITECTURE_OVERVIEW_REWRITE_MIN_OVERVIEW_CHARS,
  buildRewriteArchitectureOverviewInput,
  rewriteArchitectureOverviewFromBrief,
} from "@/lib/api/architecture-overview-rewrite-api";
import { isApiRequestError } from "@/lib/api-request-error";
import type { ApiProblemDetails } from "@/lib/api-problem";
import {
  fingerprintStructuredBriefForRewriteGate,
  structuredBriefHasRewriteGrounding,
  type ArchitectureDraftStructuredBriefState,
} from "@/lib/architecture/architecture-draft-structured-brief";
import { CTA_WIDTH, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GUIDED_INTAKE_OVERVIEW_REWRITE_ACCEPT_BUTTON,
  GUIDED_INTAKE_OVERVIEW_REWRITE_BRIEF_UNCHANGED_HINT,
  GUIDED_INTAKE_OVERVIEW_REWRITE_BUTTON,
  GUIDED_INTAKE_OVERVIEW_REWRITE_DISCARD_BUTTON,
  GUIDED_INTAKE_OVERVIEW_REWRITE_NEED_GROUNDING_HINT,
  GUIDED_INTAKE_OVERVIEW_REWRITE_NEED_OVERVIEW_HINT,
  GUIDED_INTAKE_OVERVIEW_REWRITE_PAYOFF,
  GUIDED_INTAKE_OVERVIEW_REWRITE_PREVIEW_HEADING,
  GUIDED_INTAKE_OVERVIEW_REWRITE_RESUGGEST_BUTTON,
  GUIDED_INTAKE_OVERVIEW_REWRITE_RESUGGEST_HINT,
  GUIDED_INTAKE_OVERVIEW_REWRITE_SCROLL_TO_BRIEF_LABEL,
} from "@/lib/guided-intake-copy";
import { cn } from "@/lib/utils";

const STRUCTURED_BRIEF_SECTION_ID = "architecture-draft-structured-brief-fields";

export type ArchitectureDraftOverviewRewritePanelProps = {
  readonly currentOverview: string;
  readonly systemName?: string;
  readonly businessOutcome?: string;
  readonly structuredBrief: ArchitectureDraftStructuredBriefState;
  readonly disabled?: boolean;
  readonly blocksLlmExecution?: boolean;
  readonly onOverviewAccepted: (rewrittenOverview: string) => void;
  readonly onRequestResuggestFromOverview?: () => void;
};

export function canOfferArchitectureOverviewRewrite(input: {
  readonly currentOverview: string;
  readonly structuredBrief: ArchitectureDraftStructuredBriefState;
  readonly disabled?: boolean;
  readonly blocksLlmExecution?: boolean;
  readonly rewriteBusy?: boolean;
  readonly briefUnchangedSinceAccept?: boolean;
}): boolean {
  if (input.disabled === true || input.blocksLlmExecution === true || input.rewriteBusy === true) {
    return false;
  }

  if (input.briefUnchangedSinceAccept === true) {
    return false;
  }

  if (input.currentOverview.trim().length < ARCHITECTURE_OVERVIEW_REWRITE_MIN_OVERVIEW_CHARS) {
    return false;
  }

  return structuredBriefHasRewriteGrounding(input.structuredBrief);
}

function resolveOverviewRewriteDisabledHint(input: {
  readonly currentOverview: string;
  readonly structuredBrief: ArchitectureDraftStructuredBriefState;
  readonly blocksLlmExecution?: boolean;
  readonly briefUnchangedSinceAccept?: boolean;
}): string | null {
  if (input.blocksLlmExecution === true) {
    return null;
  }

  if (input.briefUnchangedSinceAccept === true) {
    return GUIDED_INTAKE_OVERVIEW_REWRITE_BRIEF_UNCHANGED_HINT;
  }

  if (input.currentOverview.trim().length < ARCHITECTURE_OVERVIEW_REWRITE_MIN_OVERVIEW_CHARS) {
    return GUIDED_INTAKE_OVERVIEW_REWRITE_NEED_OVERVIEW_HINT;
  }

  if (!structuredBriefHasRewriteGrounding(input.structuredBrief)) {
    return GUIDED_INTAKE_OVERVIEW_REWRITE_NEED_GROUNDING_HINT;
  }

  return null;
}

/** Preview-and-accept rewrite of architecture overview from the confirmed structured brief. */
export function ArchitectureDraftOverviewRewritePanel(
  props: ArchitectureDraftOverviewRewritePanelProps,
): React.JSX.Element {
  const [rewriteBusy, setRewriteBusy] = useState(false);
  const [proposedOverview, setProposedOverview] = useState<string | null>(null);
  const [consumedBriefFingerprint, setConsumedBriefFingerprint] = useState<string | null>(null);
  const [rewriteError, setRewriteError] = useState<{
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null>(null);
  const [showResuggestOffer, setShowResuggestOffer] = useState(false);
  const [resuggestConsumed, setResuggestConsumed] = useState(false);

  const currentBriefFingerprint = fingerprintStructuredBriefForRewriteGate(props.structuredBrief);
  const briefUnchangedSinceAccept =
    consumedBriefFingerprint !== null && consumedBriefFingerprint === currentBriefFingerprint;

  const canRewrite = canOfferArchitectureOverviewRewrite({
    currentOverview: props.currentOverview,
    structuredBrief: props.structuredBrief,
    disabled: props.disabled,
    blocksLlmExecution: props.blocksLlmExecution,
    rewriteBusy,
    briefUnchangedSinceAccept,
  });
  const disabledHint = resolveOverviewRewriteDisabledHint({
    currentOverview: props.currentOverview,
    structuredBrief: props.structuredBrief,
    blocksLlmExecution: props.blocksLlmExecution,
    briefUnchangedSinceAccept,
  });

  async function onRewrite(): Promise<void> {
    if (!canRewrite) {
      return;
    }

    setRewriteBusy(true);
    setRewriteError(null);

    try {
      const response = await rewriteArchitectureOverviewFromBrief(
        buildRewriteArchitectureOverviewInput({
          currentOverview: props.currentOverview,
          systemName: props.systemName,
          businessOutcome: props.businessOutcome,
          structuredBrief: props.structuredBrief,
        }),
      );
      setProposedOverview(response.rewrittenOverview);
    } catch (error: unknown) {
      if (isApiRequestError(error)) {
        setRewriteError({
          message: error.message,
          problem: error.problem,
          correlationId: error.correlationId,
        });
      } else {
        setRewriteError({
          message: error instanceof Error ? error.message : "Could not rewrite architecture overview.",
          problem: null,
          correlationId: null,
        });
      }
    } finally {
      setRewriteBusy(false);
    }
  }

  function onDiscardPreview(): void {
    setProposedOverview(null);
    setRewriteError(null);
  }

  function onAcceptPreview(): void {
    if (proposedOverview === null) {
      return;
    }

    props.onOverviewAccepted(proposedOverview);
    setProposedOverview(null);
    setRewriteError(null);
    setConsumedBriefFingerprint(currentBriefFingerprint);
    setShowResuggestOffer(true);
  }

  function onResuggest(): void {
    if (resuggestConsumed) {
      return;
    }

    setResuggestConsumed(true);
    props.onRequestResuggestFromOverview?.();
  }

  return (
    <div
      className="space-y-3 rounded-md border border-neutral-200 bg-al-surface-raised p-3"
      data-testid="architecture-draft-overview-rewrite-panel"
    >
      <div className="space-y-1">
        <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Rewrite from brief
        </p>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {GUIDED_INTAKE_OVERVIEW_REWRITE_PAYOFF}
        </p>
      </div>

      {proposedOverview === null ? (
        <div className="space-y-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            className={CTA_WIDTH.content}
            disabled={!canRewrite}
            onClick={() => {
              void onRewrite();
            }}
            data-testid="architecture-draft-overview-rewrite"
          >
            {rewriteBusy ? "Rewriting…" : GUIDED_INTAKE_OVERVIEW_REWRITE_BUTTON}
          </Button>
          <AiBudgetSpendNotice action="Overview rewrite" testId="architecture-draft-overview-rewrite-budget" />
          {disabledHint !== null ? (
            <p
              className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}
              role="status"
              data-testid="architecture-draft-overview-rewrite-disabled-hint"
            >
              {disabledHint}{" "}
              {disabledHint === GUIDED_INTAKE_OVERVIEW_REWRITE_NEED_GROUNDING_HINT ? (
                <a href={`#${STRUCTURED_BRIEF_SECTION_ID}`} className={OPERATOR_LINK.inline}>
                  {GUIDED_INTAKE_OVERVIEW_REWRITE_SCROLL_TO_BRIEF_LABEL}
                </a>
              ) : null}
            </p>
          ) : null}
          {props.blocksLlmExecution === true ? (
            <p
              className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}
              role="status"
              data-testid="architecture-draft-overview-rewrite-budget-blocked"
            >
              Monthly AI budget is exhausted — overview rewrite is paused until the budget resets or your admin raises the limit.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <SimulatorModeAiOperationNotice testId="architecture-draft-overview-rewrite-simulator-notice" />
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}>
            {GUIDED_INTAKE_OVERVIEW_REWRITE_PREVIEW_HEADING}
          </p>
          <ArchitectureManifestUnifiedDiffView
            baselineLabel="Current overview"
            updatedLabel="Proposed overview"
            beforeText={props.currentOverview}
            afterText={proposedOverview}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              className={CTA_WIDTH.content}
              onClick={onAcceptPreview}
              data-testid="architecture-draft-overview-rewrite-accept"
            >
              {GUIDED_INTAKE_OVERVIEW_REWRITE_ACCEPT_BUTTON}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={CTA_WIDTH.content}
              onClick={onDiscardPreview}
              data-testid="architecture-draft-overview-rewrite-discard"
            >
              {GUIDED_INTAKE_OVERVIEW_REWRITE_DISCARD_BUTTON}
            </Button>
          </div>
        </div>
      )}

      {rewriteError !== null ? (
        <OperatorApiProblem
          problem={rewriteError.problem}
          fallbackMessage={rewriteError.message}
          correlationId={rewriteError.correlationId}
        />
      ) : null}

      {showResuggestOffer && !resuggestConsumed && props.onRequestResuggestFromOverview !== undefined ? (
        <div className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}>
            {GUIDED_INTAKE_OVERVIEW_REWRITE_RESUGGEST_HINT}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={CTA_WIDTH.content}
            onClick={onResuggest}
            data-testid="architecture-draft-overview-rewrite-resuggest"
          >
            {GUIDED_INTAKE_OVERVIEW_REWRITE_RESUGGEST_BUTTON}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
