import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type ScorecardMetricCardProps = {
  detail?: string;
  empty?: boolean;
  href?: string | null;
  title: string;
  value: string;
};

function MetricShell({
  children,
  className,
  href,
  testId,
}: {
  children: ReactNode;
  className: string;
  href?: string | null;
  testId: string;
}): React.JSX.Element {
  if (href !== null && href !== undefined && href.length > 0) {
    return (
      <Link href={href} className={cn(className, "block no-underline transition hover:border-neutral-400 dark:hover:border-neutral-500")} data-testid={testId}>
        {children}
      </Link>
    );
  }

  return (
    <div className={className} data-testid={testId}>
      {children}
    </div>
  );
}

export function ScorecardMetricCard({ detail, empty = false, href = null, title, value }: ScorecardMetricCardProps) {
  return (
    <MetricShell
      href={href}
      testId={`scorecard-metric-${title.toLowerCase().replace(/\s+/g, "-")}`}
      className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
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
    </MetricShell>
  );
}

type ScorecardSummaryTileProps = {
  detail: string;
  empty?: boolean;
  emphasis?: "default" | "primary";
  href?: string | null;
  label: string;
  value: string;
};

export function ScorecardSummaryTile({
  detail,
  empty = false,
  emphasis = "default",
  href = null,
  label,
  value,
}: ScorecardSummaryTileProps) {
  return (
    <MetricShell
      href={href}
      testId={`scorecard-summary-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className={cn(
        "rounded-md border px-3 py-3 shadow-sm dark:border-neutral-800",
        emphasis === "primary"
          ? "border-neutral-200 border-l-4 border-l-[var(--al-accent-interactive)] bg-white dark:bg-neutral-950"
          : "border-neutral-200 bg-al-surface-raised",
      )}
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
    </MetricShell>
  );
}

type ScorecardSavingsHeroProps = {
  actionHref?: string | null;
  actionLabel?: string | null;
  detail: string;
  empty: boolean;
  secondaryLabel?: string | null;
  value: string;
};

/** Primary value outcome — estimated review-time savings as the scorecard centerpiece. */
export function ScorecardSavingsHero({
  actionHref = null,
  actionLabel = null,
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
      {empty && actionHref !== null && actionLabel !== null && actionLabel.length > 0 ? (
        <div className="pt-1">
          <Button asChild variant="primary" size="sm" data-testid="scorecard-set-roi-assumptions-cta">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
