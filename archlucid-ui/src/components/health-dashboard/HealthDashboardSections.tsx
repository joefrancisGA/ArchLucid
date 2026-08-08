"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_PAGE_CONTAINER, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  operatorLastRefreshedExactLabel,
  operatorLastRefreshedLabel,
} from "@/lib/operator-last-refreshed-label";
import type { HealthDisplaySeverity } from "@/lib/health-readiness-presentation";

export const HEALTH_DASHBOARD_PAGE_CLASS = cn(OPERATOR_PAGE_CONTAINER.variant.workflow, "max-w-[1120px]");

type HealthRefreshToolbarProps = {
  readonly loading: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly onRefresh: () => void;
  readonly refreshTestId: string;
};

export function HealthRefreshToolbar(props: HealthRefreshToolbarProps) {
  const lastRefreshedLabel = operatorLastRefreshedLabel(props.lastRefreshedAt);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid={props.refreshTestId}
        disabled={props.loading}
        onClick={() => void props.onRefresh()}
      >
        {props.loading ? "Refreshing…" : "Refresh"}
      </Button>
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid={`${props.refreshTestId}-timestamp`}
        title={operatorLastRefreshedExactLabel(props.lastRefreshedAt)}
      >
        Last refreshed: {props.loading ? "Refreshing…" : lastRefreshedLabel}
      </p>
    </div>
  );
}

type HealthOverallStatusHeaderProps = {
  readonly overallStatus: string;
  readonly title: string;
  readonly subtitle: string;
  readonly badgeTestId: string;
};

export function HealthOverallStatusHeader(props: HealthOverallStatusHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill
            status={props.overallStatus}
            domain="health"
            uppercase={false}
            className={cn("rounded-lg border px-4 py-2 text-lg font-semibold", OPERATOR_TYPOGRAPHY.body)}
            data-testid={props.badgeTestId}
            ariaLabel={`Overall status: ${props.overallStatus}`}
          />
          <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{props.title}</p>
        </div>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{props.subtitle}</p>
      </div>
    </div>
  );
}

type HealthSummaryTileGridProps = {
  readonly tiles: ReadonlyArray<{
    readonly id: string;
    readonly label: string;
    readonly value: string;
    readonly severity: HealthDisplaySeverity | "neutral";
  }>;
  readonly testId: string;
};

/** Neutral card shell — status color belongs on the chip, not a pastel tile fill (UI design system). */
const HEALTH_SUMMARY_TILE_SHELL =
  "rounded-md border border-neutral-200 bg-transparent px-4 py-3 dark:border-neutral-700";

export function HealthSummaryTileGrid(props: HealthSummaryTileGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" data-testid={props.testId}>
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
                <StatusPill
                  status={tile.value}
                  domain="health"
                  uppercase={false}
                  className={cn("rounded-md px-2 py-0.5", OPERATOR_TYPOGRAPHY.badge)}
                />
              </div>
            ) : (
              <p className={cn("m-0 mt-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {tile.value}
              </p>
            )}
          </div>
        );
      })}
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
};

export function HealthCheckRow(props: HealthCheckRowProps) {
  const { row } = props;

  return (
    <div className="rounded-md border border-neutral-200/80 px-3 py-2 dark:border-neutral-800">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{row.label}</p>
          {row.explanation !== null ? (
            <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{row.explanation}</p>
          ) : null}
        </div>
        <StatusPill
          status={row.displayStatus}
          domain="health"
          uppercase={false}
          className={cn("shrink-0 rounded-md px-2 py-0.5", OPERATOR_TYPOGRAPHY.badge)}
        />
      </div>
      <CollapsibleSection title="Technical details" defaultOpen={false} sectionTestId={`health-check-technical-${row.checkId}`}>
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
    readonly rows: ReadonlyArray<HealthCheckRowProps["row"]>;
    readonly aggregateSeverity: HealthDisplaySeverity;
  }>;
  readonly testId: string;
};

export function HealthGroupedReadiness(props: HealthGroupedReadinessProps) {
  if (props.groups.length === 0) {
    return <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No readiness checks reported.</p>;
  }

  return (
    <div className={cn("space-y-4", OPERATOR_TYPOGRAPHY.body)} data-testid={props.testId}>
      {props.groups.map((group) => {
        const allHealthy = group.rows.every((row) => row.displayStatus === "Healthy");

        return (
          <section key={group.category.title} aria-label={group.category.title}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{group.category.title}</h3>
              <StatusPill
                status={allHealthy ? "Healthy" : group.rows.find((row) => row.displayStatus !== "Healthy")?.displayStatus ?? "Unknown"}
                domain="health"
                uppercase={false}
                className={cn("rounded-md px-2 py-0.5", OPERATOR_TYPOGRAPHY.badge)}
              />
            </div>
            {allHealthy ? (
              <p className={cn("m-0 rounded-md border border-neutral-200/80 px-3 py-2 text-al-text-secondary dark:border-neutral-800", OPERATOR_TYPOGRAPHY.helper)}>
                {group.rows.length} checks — all healthy
              </p>
            ) : (
              <div className="space-y-2">
                {group.rows.map((row) => (
                  <HealthCheckRow key={row.checkId} row={row} />
                ))}
              </div>
            )}
            {allHealthy ? (
              <CollapsibleSection title={`Show ${group.category.title} checks`} defaultOpen={false}>
                <div className="space-y-2">
                  {group.rows.map((row) => (
                    <HealthCheckRow key={row.checkId} row={row} />
                  ))}
                </div>
              </CollapsibleSection>
            ) : null}
          </section>
        );
      })}
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
};

export function HealthDashboardSection(props: HealthDashboardSectionProps) {
  return (
    <section className="space-y-3" data-testid={props.testId}>
      <div>
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{props.title}</h2>
        {props.description !== undefined ? (
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.description}</p>
        ) : null}
      </div>
      {props.children}
    </section>
  );
}
