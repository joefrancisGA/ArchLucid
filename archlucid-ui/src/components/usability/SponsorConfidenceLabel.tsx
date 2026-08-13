
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
type SponsorConfidenceLabelProps = {
  readonly confidenceLevel: "high" | "medium" | "low" | "unknown";
  readonly className?: string;
};

const CONFIDENCE_COPY: Record<SponsorConfidenceLabelProps["confidenceLevel"], string> = {
  high: "High confidence — multiple evidence sources agree",
  medium: "Medium confidence — review before sponsor distribution",
  low: "Low confidence — treat as directional until validated",
  unknown: "Confidence not yet assessed",
};

/** Plain-language confidence label for sponsor / sponsor surfaces. */
export function SponsorConfidenceLabel(props: SponsorConfidenceLabelProps) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full border px-2 py-0.5 font-medium", OPERATOR_TYPOGRAPHY.helper,
        props.confidenceLevel === "high"
          ? "border-teal-300 bg-teal-50 text-teal-900 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-200"
          : props.confidenceLevel === "medium"
            ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
            : "border-neutral-300 bg-neutral-100 text-neutral-800 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200",
        props.className,
      )}
      data-testid="sponsor-confidence-label"
    >
      {CONFIDENCE_COPY[props.confidenceLevel]}
    </span>
  );
}
