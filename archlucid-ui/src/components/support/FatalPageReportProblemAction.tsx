"use client";

import Link from "next/link";

import { OperatorReportProblemAction } from "@/components/support/OperatorReportProblemAction";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { BuildReportProblemContextInput } from "@/lib/report-problem-context";
import { REPORT_PROBLEM_EMAIL_SUPPORT_LABEL } from "@/lib/report-problem-copy";
import { isReportProblemEnabledForSurface } from "@/lib/report-problem-surfaces";
import { ARCHLUCID_SUPPORT_EMAIL } from "@/lib/support-workspace-present";
import { cn } from "@/lib/utils";

export type FatalPageReportProblemActionProps = BuildReportProblemContextInput & {
  readonly surfaceId: string;
};

/** Registry-gated Report problem trigger for fatal page shells (TB-786). */
export function FatalPageReportProblemAction(
  props: FatalPageReportProblemActionProps,
): React.JSX.Element | null {
  const { surfaceId, ...contextInput } = props;
  const enabled = isReportProblemEnabledForSurface(surfaceId);

  return <OperatorReportProblemAction enabled={enabled} {...contextInput} />;
}

/** Report problem plus tertiary email-support link for fatal page failures (TB-786). */
export function FatalPageReportProblemSupportRow(
  props: FatalPageReportProblemActionProps,
): React.JSX.Element | null {
  const { surfaceId } = props;

  if (!isReportProblemEnabledForSurface(surfaceId)) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3" data-testid="fatal-page-report-problem-row">
      <FatalPageReportProblemAction {...props} />
      <Link
        className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.body)}
        href={`mailto:${ARCHLUCID_SUPPORT_EMAIL}`}
      >
        {REPORT_PROBLEM_EMAIL_SUPPORT_LABEL}
      </Link>
    </div>
  );
}
