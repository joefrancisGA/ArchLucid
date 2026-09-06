"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { RefreshButton } from "@/components/ui/refresh-button";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { HealthSectionJumpLink } from "@/components/health-dashboard/HealthSectionJumpLink";
import { HealthStatusChip } from "@/components/health-dashboard/HealthStatusChip";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_PAGE_CONTAINER, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  formatProbeDuration,
  healthGroupCountLabel,
  slowestProbeMs,
  worstRowDisplayStatus,
} from "@/lib/health-group-metrics";
import {
  operatorFreshnessMetadataWithClockLabel,
} from "@/lib/operator/operator-last-refreshed-label";
import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";
import {
  healthGroupedAllChecksDisclosureHrefFromSearch,
  parseHealthGroupedAllChecksOpenFromSearch,
} from "@/lib/health-dashboard/health-grouped-all-checks-disclosure-url";
import {
  healthCheckTechnicalDisclosureHrefFromSearch,
  parseHealthCheckTechnicalIdFromSearch,
} from "@/lib/health-dashboard/health-check-technical-disclosure-url";
import type { HealthDisplaySeverity } from "@/lib/health-readiness-presentation";

export const HEALTH_DASHBOARD_PAGE_CLASS = cn(OPERATOR_PAGE_CONTAINER.variant.workflow, "max-w-[1120px]");

type HealthFreshnessLabelProps = {
  readonly loading: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly refreshPolicy?: string;
  readonly testId: string;
};

/**
 * Freshness reading for health surfaces: relative age for scanning, absolute clock time so
 * the reading cannot go stale silently, and the refresh policy so nobody assumes it polls.
 */
export function HealthFreshnessLabel(props: HealthFreshnessLabelProps): React.JSX.Element {
  const coreLabel = props.loading
    ? "Refreshing…"
    : operatorFreshnessMetadataWithClockLabel({
        prefix: "Last refreshed",
        lastRefreshedAt: props.lastRefreshedAt,
        refreshingLabel: null,
      });

  const displayLabel =
    props.refreshPolicy !== undefined ? `${coreLabel} · ${props.refreshPolicy}` : coreLabel;

  return (
    <OperatorPageFreshnessMetadata
      testId={props.testId}
      lastRefreshedAt={props.loading ? null : props.lastRefreshedAt}
    >
      {displayLabel}
    </OperatorPageFreshnessMetadata>
  );
}

type HealthRefreshToolbarProps = {
  readonly loading: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly onRefresh: () => void;
  readonly refreshTestId: string;
  readonly refreshPolicy?: string;
};

export function HealthRefreshToolbar(props: HealthRefreshToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <RefreshButton
        busy={props.loading}
        data-testid={props.refreshTestId}
        onClick={() => void props.onRefresh()}
      />
      <HealthFreshnessLabel
        loading={props.loading}
        lastRefreshedAt={props.lastRefreshedAt}
        refreshPolicy={props.refreshPolicy}
        testId={`${props.refreshTestId}-timestamp`}
      />
    </div>
  );
}

type HealthOverallStatusHeaderProps = {
  readonly overallStatus: string;
  readonly title: string;
  readonly subtitle: string;
  readonly badgeTestId: string;
  /** Sentence naming non-healthy or unconfigured checks so the headline is not read as absolute. */
  readonly qualifier?: string | null;
  readonly qualifierAnchorId?: string;
  readonly qualifierLinkLabel?: string;
};

export function HealthOverallStatusHeader(props: HealthOverallStatusHeaderProps) {
  const qualifier = props.qualifier ?? null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <HealthStatusChip
            status={props.overallStatus}
            ariaLabel={`Overall status: ${props.overallStatus}`}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 dark:border-neutral-700"
            testId={props.badgeTestId}
          />
          <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{props.title}</p>
        </div>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{props.subtitle}</p>
        {qualifier !== null ? (
          <p
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
            data-testid={`${props.badgeTestId}-qualifier`}
          >
            {qualifier}.
            {props.qualifierAnchorId !== undefined ? (
              <>
                {" "}
                <HealthSectionJumpLink targetId={props.qualifierAnchorId}>
                  {props.qualifierLinkLabel ?? "Review items needing attention"}
                </HealthSectionJumpLink>
              </>
            ) : null}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export type HealthSummaryTileModel = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly severity: HealthDisplaySeverity | "neutral";
  /** Counts or scope behind the status word — a tile carrying only a status word is noise. */
  readonly detail?: string;
  /** Section id this tile summarises, rendered as a same-page jump. */
  readonly anchorId?: string;
};

type HealthSummaryTileGridProps = {
  readonly tiles: readonly HealthSummaryTileModel[];
  readonly testId: string;
};

/** Neutral card shell — status color belongs on the chip, not a pastel tile fill (UI design system). */
const HEALTH_SUMMARY_TILE_SHELL =
  "rounded-md border border-neutral-200 bg-transparent px-4 py-3 dark:border-neutral-700";

export function HealthSummaryTileGrid(props: HealthSummaryTileGridProps) {
  return (
    // auto-fit keeps the final row full regardless of tile count — no ragged trailing cell.
    <div
      className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(210px,1fr))]"
      data-testid={props.testId}
    >
      {props.tiles.map((tile) => {
        const showStatusChip = tile.severity !== "neutral";

        return (
          <div
            key={tile.id}
            className={HEALTH_SUMMARY_TILE_SHELL}
            data-testid={`${props.testId}-${tile.id}`}
          >
            <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>{tile.label}</p>
            {showStatusChip ? (
              <div className="mt-2">
                <HealthStatusChip status={tile.value} />
              </div>
            ) : (
              <p className={cn("m-0 mt-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {tile.value}
              </p>
            )}
            {tile.detail !== undefined ? (
              <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{tile.detail}</p>
            ) : null}
            {tile.anchorId !== undefined ? (
              <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
                <HealthSectionJumpLink targetId={tile.anchorId}>View checks</HealthSectionJumpLink>
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

type HealthStatusChipRowLabelProps = {
  readonly term: string;
  readonly status: string;
  readonly detail: string;
};

/** Probe card inside a `<dl>`: term, status chip, and a plain-language reading. */
export function HealthStatusChipRowLabel(props: HealthStatusChipRowLabelProps): React.JSX.Element {
  return (
    <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
      <dt className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{props.term}</dt>
      <dd className="mt-2 flex flex-wrap items-center gap-2">
        <HealthStatusChip status={props.status} />
        <span className="text-al-text-secondary">{props.detail}</span>
      </dd>
    </div>
  );
}

type HealthCheckRowProps = {
  readonly row: {
    readonly checkId: string;
    readonly label: string;
    readonly displayStatus: string;
    readonly explanation: string | null;
    readonly durationMs: number | null;
  };
  /** Origin section shown above the label when the row is lifted out of its group. */
  readonly contextLabel?: string;
  /**
   * Section this row is rendered in. A check can legitimately appear in more than one
   * section, so the scope keeps each "Technical details" disclosure uniquely named.
   */
  readonly disclosureScope?: string;
};

function technicalDetailsAriaLabel(label: string, scope: string | undefined): string {
  if (scope === undefined) {
    return `Technical details — ${label}`;
  }

  return `Technical details — ${label} (${scope})`;
}

export function HealthCheckRow(props: HealthCheckRowProps) {
  const { row } = props;
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const healthCheckTechnicalIdParam = searchParams.get("healthCheckTechnicalId");
  const [technicalOpen, setTechnicalOpenState] = useState(
    () => parseHealthCheckTechnicalIdFromSearch(healthCheckTechnicalIdParam) === row.checkId,
  );

  const syncTechnicalOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        healthCheckTechnicalDisclosureHrefFromSearch(
          searchParams.toString(),
          open ? row.checkId : null,
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, row.checkId, searchParams],
  );

  const setTechnicalOpen = useCallback(
    (open: boolean) => {
      setTechnicalOpenState(open);
      syncTechnicalOpenToUrl(open);
    },
    [syncTechnicalOpenToUrl],
  );

  useEffect(() => {
    setTechnicalOpenState(parseHealthCheckTechnicalIdFromSearch(healthCheckTechnicalIdParam) === row.checkId);
  }, [healthCheckTechnicalIdParam, row.checkId]);

  return (
    <div className="rounded-md border border-neutral-200/80 px-3 py-2 dark:border-neutral-800">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {props.contextLabel !== undefined ? (
            <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>{props.contextLabel}</p>
          ) : null}
          <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{row.label}</p>
          {row.explanation !== null ? (
            <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{row.explanation}</p>
          ) : null}
        </div>
        <HealthStatusChip status={row.displayStatus} />
      </div>
      <CollapsibleSection
        title="Technical details"
        summaryAriaLabel={technicalDetailsAriaLabel(row.label, props.disclosureScope)}
        open={technicalOpen}
        onToggle={setTechnicalOpen}
        sectionTestId={`health-check-technical-${row.checkId}`}
      >
        <dl className={cn("grid gap-2", OPERATOR_TYPOGRAPHY.helper)}>
          <div>
            <dt className="text-al-text-secondary">Check ID</dt>
            <dd className={cn("m-0 font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.micro)}>{row.checkId}</dd>
          </div>
          {row.durationMs !== null ? (
            <div>
              <dt className="text-al-text-secondary">Probe duration</dt>
              <dd className="m-0 text-al-text-primary">{row.durationMs} ms</dd>
            </div>
          ) : null}
        </dl>
      </CollapsibleSection>
    </div>
  );
}

type HealthGroupedReadinessProps = {
  readonly groups: ReadonlyArray<{
    readonly category: { readonly title: string };
    readonly rows: ReadonlyArray<HealthCheckRowProps["row"] & { readonly severity: HealthDisplaySeverity }>;
    readonly aggregateSeverity: HealthDisplaySeverity;
  }>;
  readonly testId: string;
};

/**
 * Readiness groups as one scannable table rather than a stack of per-group accordions.
 * Individual checks stay reachable behind a single disclosure instead of one per group.
 */
export function HealthGroupedReadiness(props: HealthGroupedReadinessProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const healthGroupedAllChecksOpenParam = searchParams.get("healthGroupedAllChecksOpen");
  const [allChecksOpen, setAllChecksOpenState] = useState(() =>
    parseHealthGroupedAllChecksOpenFromSearch(healthGroupedAllChecksOpenParam),
  );

  const syncAllChecksOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(healthGroupedAllChecksDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setAllChecksOpen = useCallback(
    (open: boolean) => {
      setAllChecksOpenState(open);
      syncAllChecksOpenToUrl(open);
    },
    [syncAllChecksOpenToUrl],
  );

  useEffect(() => {
    setAllChecksOpenState(parseHealthGroupedAllChecksOpenFromSearch(healthGroupedAllChecksOpenParam));
  }, [healthGroupedAllChecksOpenParam]);

  if (props.groups.length === 0) {
    return <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No readiness checks reported.</p>;
  }

  const allRows = props.groups.flatMap((group) => group.rows);

  return (
    <div className="space-y-3" data-testid={props.testId}>
      <EnterpriseTable ariaLabel="Readiness checks by group">
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow>
            <EnterpriseTableHeaderCell>Group</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Checks</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Slowest probe</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {props.groups.map((group) => (
            <EnterpriseTableRow key={group.category.title}>
              <EnterpriseTableCell className="font-medium">{group.category.title}</EnterpriseTableCell>
              <EnterpriseTableCell>{healthGroupCountLabel(group.rows)}</EnterpriseTableCell>
              <EnterpriseTableCell className="tabular-nums">
                {formatProbeDuration(slowestProbeMs(group.rows))}
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <HealthStatusChip status={worstRowDisplayStatus(group.rows)} />
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>

      <CollapsibleSection
        title={`Show all ${allRows.length} ${allRows.length === 1 ? "check" : "checks"}`}
        open={allChecksOpen}
        onToggle={setAllChecksOpen}
        sectionTestId={`${props.testId}-all-checks`}
      >
        <div className={cn("space-y-4", OPERATOR_TYPOGRAPHY.body)}>
          {props.groups.map((group) => (
            <section key={group.category.title} aria-label={group.category.title}>
              <h3 className={cn("m-0 mb-2", OPERATOR_TYPOGRAPHY.cardTitle)}>{group.category.title}</h3>
              <div className="space-y-2">
                {group.rows.map((row) => (
                  <HealthCheckRow key={row.checkId} row={row} disclosureScope={`all checks, ${group.category.title}`} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}

type HealthEmptyGoodStateProps = {
  readonly message: string;
};

export function HealthEmptyGoodState(props: HealthEmptyGoodStateProps) {
  return (
    <p className={cn("m-0 rounded-md border border-neutral-200/80 bg-neutral-50/60 px-3 py-2 text-al-text-secondary dark:border-neutral-800 dark:bg-neutral-900/40", OPERATOR_TYPOGRAPHY.body)}>
      {props.message}
    </p>
  );
}

type HealthDashboardSectionProps = {
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
  readonly testId?: string;
  readonly headingId?: string;
};

export function HealthDashboardSection(props: HealthDashboardSectionProps) {
  return (
    <section className="space-y-3" data-testid={props.testId}>
      <div>
        <h2 id={props.headingId} className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {props.title}
        </h2>
        {props.description !== undefined ? (
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.description}</p>
        ) : null}
      </div>
      {props.children}
    </section>
  );
}
