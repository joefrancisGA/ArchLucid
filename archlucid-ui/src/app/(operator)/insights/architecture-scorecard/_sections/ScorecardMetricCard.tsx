import { cn } from "@/lib/utils";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type ScorecardMetricCardProps = {
  detail?: string;
  empty?: boolean;
  title: string;
  value: string;
};

export function ScorecardMetricCard({ detail, empty = false, title, value }: ScorecardMetricCardProps) {
  return (
    <div
      className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      data-testid={`scorecard-metric-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <p className={cn(OPERATOR_TYPOGRAPHY.tab, "uppercase tracking-wide text-al-text-secondary")}>{title}</p>
      <p
        className={cn(
          "mt-2",
          empty ? cn(OPERATOR_TYPOGRAPHY.sectionTitle, "text-al-text-secondary") : OPERATOR_TYPOGRAPHY.kpiValue,
        )}
      >
        {value}
      </p>

      {detail ? (
        <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>{detail}</p>
      ) : null}
    </div>
  );
}

type ScorecardSummaryTileProps = {
  detail: string;
  empty?: boolean;
  emphasis?: "default" | "primary";
  label: string;
  value: string;
};

export function ScorecardSummaryTile({
  detail,
  empty = false,
  emphasis = "default",
  label,
  value,
}: ScorecardSummaryTileProps) {
  return (
    <div
      className={cn(
        "rounded-md border px-3 py-3 shadow-sm dark:border-neutral-800",
        emphasis === "primary"
          ? "border-neutral-200 border-l-4 border-l-[var(--al-accent-interactive)] bg-white dark:bg-neutral-950"
          : "border-neutral-200 bg-al-surface-raised",
      )}
      data-testid={`scorecard-summary-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{label}</p>
      <p
        className={cn(
          "m-0 mt-1 font-semibold",
          empty
            ? cn(OPERATOR_TYPOGRAPHY.sectionTitle, "text-al-text-secondary")
            : cn(OPERATOR_TYPOGRAPHY.kpiValue, "text-al-text-primary"),
        )}
      >
        {value}
      </p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{detail}</p>
    </div>
  );
}

type ScorecardSavingsHeroProps = {
  detail: string;
  empty: boolean;
  secondaryLabel?: string | null;
  value: string;
};

/** Primary value outcome — estimated review-time savings as the scorecard centerpiece. */
export function ScorecardSavingsHero({
  detail,
  empty,
  secondaryLabel = null,
  value,
}: ScorecardSavingsHeroProps) {
  return (
    <section
      className={cn(DESIGN_TOKENS.banner.page, "space-y-2")}
      data-testid="scorecard-summary-estimated-review-time-savings"
      aria-label="Estimated review-time savings"
    >
      <p className={cn("m-0 uppercase tracking-wide text-al-text-secondary", OPERATOR_TYPOGRAPHY.tab)}>
        Estimated annual review-time savings
      </p>
      <p
        className={cn(
          "m-0 font-semibold text-al-text-primary",
          empty ? OPERATOR_TYPOGRAPHY.sectionTitle : "font-mono text-5xl tabular-nums sm:text-6xl",
        )}
      >
        {value}
      </p>
      {secondaryLabel !== null && secondaryLabel.length > 0 ? (
        <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{secondaryLabel}</p>
      ) : null}
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{detail}</p>
    </section>
  );
}
