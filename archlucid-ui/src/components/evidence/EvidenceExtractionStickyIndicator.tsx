"use client";

import { Check, Loader2 } from "lucide-react";

import {
  EVIDENCE_EXTRACTION_PROGRESS_CARD_ID,
} from "@/components/evidence/EvidenceExtractionProgressCard";
import { OPERATOR_SHELL_STICKY_TOP_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  EVIDENCE_EXTRACTION_STICKY_JUMP_HINT,
  EVIDENCE_EXTRACTION_STICKY_PROCESSING_LABEL,
  EVIDENCE_EXTRACTION_STICKY_READY_LABEL,
} from "@/lib/evidence/evidence-extraction-progress-copy";
import { cn } from "@/lib/utils";

export type EvidenceExtractionStickyIndicatorProps = {
  readonly visible: boolean;
  readonly phase: "processing" | "complete";
  readonly className?: string;
};

/** Compact sticky chip when the inline processing card scrolls out of view. */
export function EvidenceExtractionStickyIndicator(
  props: EvidenceExtractionStickyIndicatorProps,
): React.JSX.Element | null {
  if (!props.visible) {
    return null;
  }

  const isProcessing = props.phase === "processing";
  const label = isProcessing
    ? EVIDENCE_EXTRACTION_STICKY_PROCESSING_LABEL
    : EVIDENCE_EXTRACTION_STICKY_READY_LABEL;

  return (
    <a
      href={`#${EVIDENCE_EXTRACTION_PROGRESS_CARD_ID}`}
      className={cn(
        "fixed right-4 z-20 inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-al-surface-raised px-3 py-1.5 shadow-sm",
        "text-al-text-primary no-underline hover:bg-[var(--al-layer-hover)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)]",
        OPERATOR_SHELL_STICKY_TOP_CLASS,
        OPERATOR_TYPOGRAPHY.helper,
        "print:hidden",
        props.className,
      )}
      data-testid="evidence-extraction-sticky-indicator"
      aria-label={EVIDENCE_EXTRACTION_STICKY_JUMP_HINT}
      onClick={(event) => {
        event.preventDefault();
        const target = document.getElementById(EVIDENCE_EXTRACTION_PROGRESS_CARD_ID);

        if (target === null) {
          return;
        }

        target.scrollIntoView({ behavior: "smooth", block: "start" });
        target.focus({ preventScroll: true });
      }}
    >
      {isProcessing ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[var(--al-accent-interactive)]" aria-hidden />
      ) : (
        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden />
      )}
      <span>{label}</span>
    </a>
  );
}
