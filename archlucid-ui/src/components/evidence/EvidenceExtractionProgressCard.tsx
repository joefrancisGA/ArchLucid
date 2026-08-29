"use client";

import { Check } from "lucide-react";

import { ReviewStartInlineSpinner } from "@/components/review-intake/ReviewStartInlineSpinner";
import { StagedProgressStepList } from "@/components/progress/StagedProgressStepList";
import { IndeterminateProgressSweep } from "@/components/ui/indeterminate-progress-sweep";
import { OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  EVIDENCE_EXTRACTION_COMPLETE_HEADLINE,
  EVIDENCE_EXTRACTION_CONTINUE_EDITING_NOTE,
  EVIDENCE_EXTRACTION_DURATION_EXPECTATION,
  EVIDENCE_EXTRACTION_PROCESSING_HEADLINE,
  EVIDENCE_EXTRACTION_PROGRESS_BAR_LABEL,
  formatEvidenceExtractionCompletionSummary,
  formatEvidenceExtractionDocumentLine,
} from "@/lib/evidence/evidence-extraction-progress-copy";
import type { EvidenceExtractionStageDefinition } from "@/lib/evidence/evidence-extraction-progress-stages";
import type { EvidenceExtractionCompletion } from "@/hooks/use-evidence-extraction-progress";
import { cn } from "@/lib/utils";

export const EVIDENCE_EXTRACTION_PROGRESS_CARD_ID = "evidence-extraction-progress-card";

export type EvidenceExtractionProgressCardProps = {
  readonly phase: "processing" | "complete";
  readonly documentNames: readonly string[];
  readonly stages: readonly EvidenceExtractionStageDefinition[];
  readonly activeStageIndex: number;
  readonly completion: EvidenceExtractionCompletion | null;
  readonly cardRef?: React.RefObject<HTMLDivElement | null>;
  readonly className?: string;
};

/** Inline processing card shown directly under attached evidence on the quick-start intake page. */
export function EvidenceExtractionProgressCard(props: EvidenceExtractionProgressCardProps): React.JSX.Element {
  const documentLine = formatEvidenceExtractionDocumentLine(props.documentNames);
  const isProcessing = props.phase === "processing";

  return (
    <div
      ref={props.cardRef}
      id={EVIDENCE_EXTRACTION_PROGRESS_CARD_ID}
      tabIndex={-1}
      className={cn(
        "rounded-md border border-neutral-200 border-l-4 bg-al-surface-raised px-3 py-3 dark:border-neutral-700",
        OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
        isProcessing
          ? "border-l-[var(--al-accent-interactive)]"
          : "border-l-emerald-600 dark:border-l-emerald-500",
        props.className,
      )}
      data-testid="evidence-extraction-progress-card"
      role="status"
      aria-live="polite"
      aria-busy={isProcessing}
    >
      <div className="flex items-start gap-2">
        {isProcessing ? (
          <ReviewStartInlineSpinner className="mt-0.5 text-[var(--al-accent-interactive)]" />
        ) : (
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden />
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {isProcessing ? EVIDENCE_EXTRACTION_PROCESSING_HEADLINE : EVIDENCE_EXTRACTION_COMPLETE_HEADLINE}
          </p>

          {documentLine.length > 0 ? (
            <p
              className={cn("m-0 break-all text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="evidence-extraction-document-line"
            >
              {documentLine}
            </p>
          ) : null}

          {isProcessing ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Reading the document and extracting architecture context…
            </p>
          ) : null}

          {isProcessing ? (
            <IndeterminateProgressSweep label={EVIDENCE_EXTRACTION_PROGRESS_BAR_LABEL} />
          ) : null}

          {isProcessing ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {EVIDENCE_EXTRACTION_DURATION_EXPECTATION}
            </p>
          ) : null}

          {isProcessing ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {EVIDENCE_EXTRACTION_CONTINUE_EDITING_NOTE}
            </p>
          ) : null}

          {!isProcessing && props.completion !== null ? (
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="evidence-extraction-completion-summary"
            >
              {formatEvidenceExtractionCompletionSummary(props.completion)}
            </p>
          ) : null}

          <StagedProgressStepList
            steps={props.stages}
            activeStepIndex={props.activeStageIndex}
            allComplete={!isProcessing}
            testId="evidence-extraction-stage-list"
          />
        </div>
      </div>
    </div>
  );
}
