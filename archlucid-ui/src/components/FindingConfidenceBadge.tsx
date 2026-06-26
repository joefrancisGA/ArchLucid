import { Shield } from "lucide-react";

import { cn } from "@/lib/utils";
import { enterpriseStatusTagClass } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { FindingConfidenceLevel } from "@/types/explanation";

export type FindingConfidenceBadgeProps = {
  level: FindingConfidenceLevel | null | undefined;
};

/**
 * Compact pill for evaluation-derived coarse confidence (harness + reference-case + trace completeness).
 */
export function FindingConfidenceBadge({ level }: FindingConfidenceBadgeProps) {
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
    <span
      role="status"
      aria-label={cfg.label}
      data-archlucid-confidence={level}
      className={cn("finding-confidence-badge inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${cfg.pillClass}", OPERATOR_TYPOGRAPHY.helper)}
    >
      <Shield className={`h-3.5 w-3.5 shrink-0 ${cfg.iconClass}`} aria-hidden />
      {cfg.label}
    </span>
  );
}
