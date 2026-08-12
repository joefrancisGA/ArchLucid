"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  ARCHITECTURE_STRUCTURED_PARSE_FAILURE_MESSAGE,
  ARCHITECTURE_STRUCTURED_REPORT_ISSUE_LABEL,
  ARCHITECTURE_STRUCTURED_RETRY_LABEL,
} from "@/lib/architecture/architecture-structured-content-copy";
import { SETTINGS_SUPPORT_PATH } from "@/lib/settings-admin-route-paths";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ArchitectureStructuringFailureNoticeProps = {
  readonly runId: string | null;
  readonly onRetry: () => void;
};

function buildReportIssueHref(runId: string | null): string {
  if (runId === null || runId.trim().length === 0) {
    return `${SETTINGS_SUPPORT_PATH}?topic=architecture-structuring`;
  }

  return `${SETTINGS_SUPPORT_PATH}?topic=architecture-structuring&runId=${encodeURIComponent(runId.trim())}`;
}

/** Amber status banner when generated architecture text could not be fully structured. */
export function ArchitectureStructuringFailureNotice(
  props: ArchitectureStructuringFailureNoticeProps,
): React.JSX.Element {
  return (
    <div
      className="rounded-md border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-900 dark:bg-amber-950/30"
      data-testid="architecture-structured-parse-failure"
      role="status"
    >
      <p className={cn("m-0 text-amber-950 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)}>
        {ARCHITECTURE_STRUCTURED_PARSE_FAILURE_MESSAGE}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="architecture-structured-retry"
          onClick={props.onRetry}
        >
          {ARCHITECTURE_STRUCTURED_RETRY_LABEL}
        </Button>
        <Button type="button" variant="outline" size="sm" asChild data-testid="architecture-structured-report-issue">
          <Link href={buildReportIssueHref(props.runId)}>{ARCHITECTURE_STRUCTURED_REPORT_ISSUE_LABEL}</Link>
        </Button>
      </div>
    </div>
  );
}
