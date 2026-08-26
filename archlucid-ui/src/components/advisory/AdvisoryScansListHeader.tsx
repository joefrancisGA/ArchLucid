"use client";

import { cn } from "@/lib/utils";

import { RefreshButton } from "@/components/ui/refresh-button";
import {
  ADVISORY_SCANS_LAST_LOADED_PREFIX,
  ADVISORY_SCANS_LIST_COUNT_LABEL,
  ADVISORY_SCANS_LIST_HEADING,
} from "@/lib/advisory-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

function formatAdvisoryScansLastLoaded(lastLoadedUtc: string | null): string {
  if (lastLoadedUtc === null) {
    return " — ";
  }

  const parsed = new Date(lastLoadedUtc);

  if (Number.isNaN(parsed.getTime())) {
    return " — ";
  }

  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export type AdvisoryScansListHeaderProps = {
  readonly projectLabel: string;
  readonly recommendationCount: number;
  readonly lastLoadedUtc: string | null;
  readonly loading: boolean;
  readonly onRefresh: () => void;
};

export function AdvisoryScansListHeader(props: AdvisoryScansListHeaderProps): React.JSX.Element {
  const { projectLabel, recommendationCount, lastLoadedUtc, loading, onRefresh } = props;
  const lastLoadedLabel = formatAdvisoryScansLastLoaded(lastLoadedUtc);

  return (
    <div
      className="flex flex-wrap items-start justify-between gap-2"
      data-testid="advisory-scans-list-header"
    >
      <div className="min-w-0 space-y-1">
        <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {ADVISORY_SCANS_LIST_HEADING}
        </h3>
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-al-text-primary">Project scope:</span> {projectLabel}
          <span aria-hidden="true"> · </span>
          <span data-testid="advisory-scans-count">
            {recommendationCount} {ADVISORY_SCANS_LIST_COUNT_LABEL}
          </span>
          <span aria-hidden="true"> · </span>
          <span data-testid="advisory-scans-last-loaded">
            {ADVISORY_SCANS_LAST_LOADED_PREFIX}: {lastLoadedLabel}
          </span>
        </p>
      </div>
      <RefreshButton busy={loading} data-testid="advisory-scans-refresh" onClick={onRefresh} />
    </div>
  );
}
