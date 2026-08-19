"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { formatRelativeTime } from "@/lib/relative-time";
import { CONNECTION_STATUS_HELP_READINESS_SECTION_TITLE } from "@/lib/connection-status-help-guide-content";
import type {
  ConnectionStatusHelpReadinessMetric,
  ConnectionStatusHelpWorkspaceReadinessSnapshot,
} from "@/lib/use-connection-status-help-workspace-readiness";
import { useConnectionStatusHelpWorkspaceReadiness } from "@/lib/use-connection-status-help-workspace-readiness";

export const HELP_CONNECTION_STATUS_WORKSPACE_READINESS_HEADING_ID =
  "help-connection-status-workspace-readiness-heading";

function readinessMetricAccentClass(statusKind: EnterpriseStatusKind): string {
  switch (statusKind) {
    case "ready":
      return "border-l-emerald-600 dark:border-l-emerald-500";
    case "needs-attention":
      return "border-l-amber-600 dark:border-l-amber-500";
    case "blocked":
      return "border-l-rose-600 dark:border-l-rose-500";
    case "in-progress":
      return "border-l-sky-600 dark:border-l-sky-500";
    default:
      return "border-l-neutral-300 dark:border-l-neutral-600";
  }
}

type ReadinessMetricProps = {
  readonly metric: ConnectionStatusHelpReadinessMetric;
};

function ReadinessMetric(props: ReadinessMetricProps): React.ReactElement {
  const { metric } = props;

  return (
    <div
      className={cn(
        "rounded-md border border-neutral-200 border-l-4 bg-al-surface-raised px-3 py-2 dark:border-neutral-800",
        readinessMetricAccentClass(metric.statusKind),
      )}
      data-testid={`help-connection-status-readiness-tile-${metric.id}`}
    >
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{metric.label}</p>
      <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.kpiValue)}>{metric.valueLabel}</p>
    </div>
  );
}

type HelpConnectionStatusWorkspaceReadinessStripProps = {
  readonly readiness?: ConnectionStatusHelpWorkspaceReadinessSnapshot;
};

/** Live summary-strip counts for `/help/connection-status`. */
export function HelpConnectionStatusWorkspaceReadinessStrip(
  props: HelpConnectionStatusWorkspaceReadinessStripProps = {},
): React.ReactElement {
  const hookReadiness = useConnectionStatusHelpWorkspaceReadiness();
  const readiness = props.readiness ?? hookReadiness;

  const scopeLine = useMemo((): string | null => {
    if (readiness.loading || readiness.workspaceScopeLabel === null) {
      return null;
    }

    return readiness.workspaceScopeLabel;
  }, [readiness.loading, readiness.workspaceScopeLabel]);

  const asOfLabel = useMemo((): string | null => {
    if (readiness.loading) {
      return "Loading…";
    }

    if (readiness.loadForbidden || readiness.loadedAtUtc === null) {
      return null;
    }

    const absoluteUtc = formatInstantForLocale(readiness.loadedAtUtc);
    const relative = formatRelativeTime(readiness.loadedAtUtc);

    return `${absoluteUtc} (${relative})`;
  }, [readiness.loadForbidden, readiness.loadedAtUtc, readiness.loading]);

  const headerMeta = [scopeLine, asOfLabel].filter((part): part is string => part !== null).join(" · ");

  return (
    <section
      aria-busy={readiness.loading ? true : undefined}
      aria-labelledby={HELP_CONNECTION_STATUS_WORKSPACE_READINESS_HEADING_ID}
      aria-live="polite"
      className="space-y-3"
      data-testid="help-connection-status-workspace-readiness"
      id="help-connection-status-workspace-readiness"
    >
      <header className="space-y-1">
        <h2
          id={HELP_CONNECTION_STATUS_WORKSPACE_READINESS_HEADING_ID}
          className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}
        >
          {CONNECTION_STATUS_HELP_READINESS_SECTION_TITLE}
        </h2>
        {headerMeta.length > 0 ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{headerMeta}</p>
        ) : null}
      </header>

      {readiness.loadForbidden ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="help-connection-status-workspace-readiness-forbidden"
        >
          Workspace connector status is not available at your current permission level.
        </p>
      ) : readiness.loadFailed ? (
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="help-connection-status-workspace-readiness-failed"
          >
            Workspace connector status could not be loaded.
          </p>
          <Button
            data-testid="help-connection-status-workspace-readiness-retry"
            onClick={() => {
              readiness.reload();
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(readiness.metrics.length > 0 ? readiness.metrics : readiness.loading ? readiness.metrics : []).map(
            (metric) => (
              <ReadinessMetric key={metric.id} metric={metric} />
            ),
          )}
          {readiness.loading && readiness.metrics.length === 0
            ? ["connected", "recommended", "optional", "disabled", "background"].map((tileId) => (
                <div
                  key={tileId}
                  className="rounded-md border border-l-4 border-neutral-200 border-l-neutral-300 bg-al-surface-raised px-3 py-2 dark:border-neutral-800 dark:border-l-neutral-600"
                  data-testid={`help-connection-status-readiness-tile-${tileId}-loading`}
                >
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>…</p>
                  <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.kpiValue)}>…</p>
                </div>
              ))
            : null}
        </div>
      )}
    </section>
  );
}
