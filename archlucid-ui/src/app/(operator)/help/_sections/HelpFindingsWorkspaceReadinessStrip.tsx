"use client";

import Link from "next/link";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { cn } from "@/lib/utils";

import {
  FINDINGS_HELP_READINESS_FORBIDDEN_MESSAGE,
  FINDINGS_HELP_READINESS_SECTION_TITLE,
} from "@/lib/findings-help-guide-content";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatRelativeTime } from "@/lib/relative-time";
import type {
  FindingsHelpWorkspaceReadinessMetric,
  FindingsHelpWorkspaceReadinessSnapshot,
} from "@/lib/use-findings-help-workspace-readiness";
import { useFindingsHelpWorkspaceReadiness } from "@/lib/use-findings-help-workspace-readiness";

export const HELP_FINDINGS_WORKSPACE_READINESS_HEADING_ID = "help-findings-workspace-readiness-heading";

type ReadinessMetricProps = {
  readonly metric: FindingsHelpWorkspaceReadinessMetric;
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

type HelpFindingsWorkspaceReadinessStripProps = {
  readonly readiness?: FindingsHelpWorkspaceReadinessSnapshot;
};

/** Compact workspace finding summary for `/help/findings` — live API data only. */
export function HelpFindingsWorkspaceReadinessStrip(
  props: HelpFindingsWorkspaceReadinessStripProps = {},
): React.ReactElement {
  const hookReadiness = useFindingsHelpWorkspaceReadiness();
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

    // Forbidden responses never retrieved workspace counts — do not imply freshness.
    if (readiness.loadForbidden || readiness.loadedAtUtc === null) {
      return null;
    }

    return `As of ${formatRelativeTime(readiness.loadedAtUtc)}`;
  }, [readiness.loadForbidden, readiness.loadedAtUtc, readiness.loading]);

  const headerMeta = [scopeLine, asOfLabel].filter((part): part is string => part !== null).join(" · ");

  return (
    <section
      aria-busy={readiness.loading ? true : undefined}
      aria-labelledby={HELP_FINDINGS_WORKSPACE_READINESS_HEADING_ID}
      aria-live="polite"
      className="space-y-3"
      data-testid="help-findings-workspace-readiness"
    >
      <header className="space-y-1">
        <h2
          id={HELP_FINDINGS_WORKSPACE_READINESS_HEADING_ID}
          className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}
        >
          {FINDINGS_HELP_READINESS_SECTION_TITLE}
        </h2>
        {headerMeta.length > 0 ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{headerMeta}</p>
        ) : null}
      </header>

      {readiness.loadForbidden ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="help-findings-workspace-readiness-forbidden"
        >
          {FINDINGS_HELP_READINESS_FORBIDDEN_MESSAGE}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ReadinessMetric metric={readiness.openFindings} />
          <ReadinessMetric metric={readiness.criticalAndError} />
          <ReadinessMetric metric={readiness.awaitingDecision} />
          <ReadinessMetric metric={readiness.recentlyResolved} />
        </div>
      )}

      {readiness.loadFailed ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            Workspace finding status could not be loaded.
          </p>
          <Button
            data-testid="help-findings-workspace-readiness-retry"
            onClick={() => {
              void readiness.reload();
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      ) : null}
    </section>
  );
}
