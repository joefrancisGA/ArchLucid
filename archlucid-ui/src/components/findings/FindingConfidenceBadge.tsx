import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";

import { enterpriseStatusTagClass } from "@/lib/design-tokens";
import type { FindingConfidenceLevel } from "@/types/explanation";

export const FINDING_CONFIDENCE_BADGE_SCOPE_LINE =
  "Recorded trace confidence for this finding — not severity or exploit likelihood." as const;

export type FindingConfidenceBadgeProps = {
  level: FindingConfidenceLevel | null | undefined;
  readonly showScopeLine?: boolean;
};

/**
 * Compact pill for evaluation-derived coarse confidence (harness + reference-case + trace completeness).
 */
export function FindingConfidenceBadge({ level, showScopeLine = false }: FindingConfidenceBadgeProps) {
  if (level !== "High" && level !== "Medium" && level !== "Low") {
    return null;
  }

  const cfg =
    level === "High"
      ? {
          label: "High confidence",
          pillClass: enterpriseStatusTagClass("ready"),
          iconClass: "text-al-text-primary",
        }
      : level === "Medium"
        ? {
            label: "Medium confidence",
            pillClass: enterpriseStatusTagClass("needs-attention"),
            iconClass: "text-al-text-primary",
          }
        : {
            label: "Low confidence",
            pillClass: enterpriseStatusTagClass("blocked"),
            iconClass: "text-al-text-primary",
          };

  return (
    <span className="inline-flex flex-col gap-0.5">
      <span
        role="status"
        aria-label={`${cfg.label}. ${FINDING_CONFIDENCE_BADGE_SCOPE_LINE}`}
        data-archlucid-confidence={level}
        className={cn("finding-confidence-badge inline-flex w-fit items-center gap-1", cfg.pillClass)}
      >
        <Shield className={`h-3.5 w-3.5 shrink-0 ${cfg.iconClass}`} aria-hidden />
        {cfg.label}
      </span>
      {showScopeLine ? (
        <span className="text-[0.7rem] font-normal leading-snug text-neutral-500 dark:text-neutral-400">
          {FINDING_CONFIDENCE_BADGE_SCOPE_LINE}
        </span>
      ) : null}
    </span>
  );
}
