import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { cn } from "@/lib/utils";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  REVIEW_SCORECARD_NOT_MEASURED_LABEL,
  type ReviewScorecardMetricState,
} from "@/lib/pilot-scorecard-present";

type ScorecardMetricCardProps = {
  detail?: string;
  drillDownLabel?: string;
  empty?: boolean;
  href?: string | null;
  metricState?: ReviewScorecardMetricState;
  sourceDisclosure?: string;
  title: string;
  useKpiEmphasis?: boolean;
  value: string;
};

function MetricShell({
  accessibleName,
  children,
  className,
  href,
  testId,
}: {
  accessibleName?: string;
  children: ReactNode;
  className: string;
  href?: string | null;
  testId: string;
}): React.JSX.Element {
  if (href !== null && href !== undefined && href.length > 0) {
    return (
      <Link
        href={href}
        aria-label={accessibleName}
        className={cn(
          className,
          "block no-underline transition hover:border-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-interactive)] focus-visible:ring-offset-2 dark:hover:border-neutral-500",
        )}
        data-testid={testId}
      >
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

function MetricValueDisplay({
  metricState,
  useKpiEmphasis,
  value,
}: {
  metricState: ReviewScorecardMetricState;
  useKpiEmphasis: boolean;
  value: string;
}): React.JSX.Element {
  const unavailable = metricState === "unavailable";
  const subdued = unavailable || metricState === "measuredZero";

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <p
        className={cn(
          "m-0",
          subdued || !useKpiEmphasis
            ? cn(OPERATOR_TYPOGRAPHY.sectionTitle, "text-al-text-secondary")
            : OPERATOR_TYPOGRAPHY.kpiValue,
        )}
      >
        {value}
      </p>
      {unavailable ? (
        <>
          <span className="sr-only">{REVIEW_SCORECARD_NOT_MEASURED_LABEL}</span>
          <StatusTag kind="draft" label={REVIEW_SCORECARD_NOT_MEASURED_LABEL} />
        </>
      ) : null}
    </div>
  );
}

export function ScorecardMetricCard({
  detail,
  drillDownLabel,
  empty = false,
  href = null,
  metricState = empty ? "unavailable" : "measured",
  sourceDisclosure,
  title,
  useKpiEmphasis = true,
  value,
}: ScorecardMetricCardProps) {
  const accessibleName =
    href !== null && href !== undefined && drillDownLabel !== undefined && drillDownLabel.length > 0
      ? `${drillDownLabel} — ${title}`
      : undefined;

  return (
    <MetricShell
      accessibleName={accessibleName}
      href={href}
      testId={`scorecard-metric-${title.toLowerCase().replace(/\s+/g, "-")}`}
      className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      <p className={cn(OPERATOR_TYPOGRAPHY.tab, "uppercase tracking-wide text-al-text-secondary")}>{title}</p>
      <MetricValueDisplay metricState={metricState} useKpiEmphasis={useKpiEmphasis} value={value} />

      {detail ? (
        <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>{detail}</p>
      ) : null}
      {sourceDisclosure !== undefined && sourceDisclosure.length > 0 ? (
        <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
          Provenance: {sourceDisclosure}
        </p>
      ) : null}
      {href !== null && href !== undefined && drillDownLabel !== undefined && drillDownLabel.length > 0 ? (
        <p
          className={cn(
            "mt-2 flex items-center gap-1 font-medium text-[color:var(--al-accent-interactive)]",
            OPERATOR_TYPOGRAPHY.helper,
          )}
        >
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
          <span>{drillDownLabel}</span>
        </p>
      ) : null}
    </MetricShell>
  );
}

type ScorecardSummaryTileProps = {
  detail: string;
  drillDownLabel?: string;
  empty?: boolean;
  emphasis?: "default" | "primary";
  href?: string | null;
  label: string;
  metricState?: ReviewScorecardMetricState;
  useKpiEmphasis?: boolean;
  value: string;
};

export function ScorecardSummaryTile({
  detail,
  drillDownLabel,
  empty = false,
  emphasis = "default",
  href = null,
  label,
  metricState = empty ? "unavailable" : "measured",
  useKpiEmphasis = true,
  value,
}: ScorecardSummaryTileProps) {
  const accessibleName =
    href !== null && href !== undefined && drillDownLabel !== undefined && drillDownLabel.length > 0
      ? `${drillDownLabel} — ${label}`
      : undefined;

  return (
    <MetricShell
      accessibleName={accessibleName}
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
      <MetricValueDisplay metricState={metricState} useKpiEmphasis={useKpiEmphasis} value={value} />
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{detail}</p>
      {href !== null && href !== undefined && drillDownLabel !== undefined && drillDownLabel.length > 0 ? (
        <p
          className={cn(
            "m-0 mt-2 flex items-center gap-1 font-medium text-[color:var(--al-accent-interactive)]",
            OPERATOR_TYPOGRAPHY.helper,
          )}
        >
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
          <span>{drillDownLabel}</span>
        </p>
      ) : null}
    </MetricShell>
  );
}

type ScorecardSavingsHeroProps = {
  actionHref?: string | null;
  actionLabel?: string | null;
  compact?: boolean;
  detail: string;
  empty: boolean;
  secondaryLabel?: string | null;
  value: string;
};

/** Primary value outcome — estimated review-time savings as the scorecard centerpiece. */
export function ScorecardSavingsHero({
  actionHref = null,
  actionLabel = null,
  compact = false,
  detail,
  empty,
  secondaryLabel = null,
  value,
}: ScorecardSavingsHeroProps) {
  return (
    <section
      className={cn(
        compact ? "rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800" : DESIGN_TOKENS.banner.page,
        "space-y-2",
      )}
      data-testid="scorecard-summary-estimated-review-time-savings"
      aria-label="Estimated review-time savings"
    >
      <p className={cn("m-0 uppercase tracking-wide text-al-text-secondary", OPERATOR_TYPOGRAPHY.tab)}>
        Estimated annual review-time savings
      </p>
      <p
        className={cn(
          "m-0 font-semibold text-al-text-primary",
          empty || compact
            ? OPERATOR_TYPOGRAPHY.sectionTitle
            : "font-mono text-5xl tabular-nums sm:text-6xl",
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
          <Button asChild variant="primary" size="sm" data-testid="scorecard-configure-roi-assumptions-cta">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        </div>
      ) : null}
    </section>
  );
}

type ScorecardSavingsClaimDisciplineProps = {
  children: string;
};

export function ScorecardSavingsClaimDiscipline({ children }: ScorecardSavingsClaimDisciplineProps): React.JSX.Element {
  return (
    <aside
      className="rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-800"
      data-testid="architecture-scorecard-claim-discipline"
      role="note"
    >
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{children}</p>
    </aside>
  );
}
