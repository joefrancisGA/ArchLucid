"use client";

import Link from "next/link";
import { useMemo } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatRelativeTime } from "@/lib/relative-time";
import { CONNECTION_STATUS_HELP_READINESS_SECTION_TITLE } from "@/lib/connection-status-help-guide-content";
import type {
  ConnectionStatusHelpReadinessMetric,
  ConnectionStatusHelpWorkspaceReadinessSnapshot,
} from "@/lib/use-connection-status-help-workspace-readiness";
import { useConnectionStatusHelpWorkspaceReadiness } from "@/lib/use-connection-status-help-workspace-readiness";

export const HELP_CONNECTION_STATUS_WORKSPACE_READINESS_HEADING_ID =
  "help-connection-status-workspace-readiness-heading";

type ReadinessMetricProps = {
  readonly metric: ConnectionStatusHelpReadinessMetric;
};

function ReadinessMetric(props: ReadinessMetricProps): React.ReactElement {
  const { metric } = props;

  return (
    <Link
      className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-900"
      href={metric.href}
    >
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{metric.label}</p>
      <div className="mt-1">
        <StatusTag kind={metric.statusKind} label={metric.valueLabel} />
      </div>
    </Link>
  );
}

type HelpConnectionStatusWorkspaceReadinessStripProps = {
  readonly readiness?: ConnectionStatusHelpWorkspaceReadinessSnapshot;
};

/** Live summary-strip counts for `/help/connection-status`. */
export function HelpConnectionStatusWorkspaceReadinessStrip(
  props: HelpConnectionStatusWorkspaceReadinessStripProps = {},
): React.ReactElement | null {
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

    return `As of ${formatRelativeTime(readiness.loadedAtUtc)}`;
  }, [readiness.loadForbidden, readiness.loadedAtUtc, readiness.loading]);

  if (!readiness.loading && readiness.loadFailed) {
    return null;
  }

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
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(readiness.metrics.length > 0 ? readiness.metrics : readiness.loading ? readiness.metrics : []).map(
            (metric) => (
              <ReadinessMetric key={metric.label} metric={metric} />
            ),
          )}
          {readiness.loading && readiness.metrics.length === 0
            ? ["Integrations connected", "Recommended setup remaining", "Optional not configured"].map((label) => (
                <div
                  key={label}
                  className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800"
                >
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{label}</p>
                  <div className="mt-1">
                    <StatusTag kind="neutral" label="…" />
                  </div>
                </div>
              ))
            : null}
        </div>
      )}
    </section>
  );
}
