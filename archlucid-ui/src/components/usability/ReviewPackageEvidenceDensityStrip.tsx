import { cn } from "@/lib/utils";
import Link from "next/link";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ReviewPackageEvidenceDensityStripProps = {
  readonly findingCount: number | null;
  readonly evidenceArtifactCount: number;
  readonly policiesCheckedLabel: string | null;
  readonly governanceApprovalLabel: string | null;
  readonly auditTrailHref: string | null;
  readonly className?: string;
};

function countDisplay(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return " — ";
  }

  return String(Math.max(0, Math.trunc(value)));
}

/** Compact evidence-density header — quantifies rigor before the reviewer reads individual findings. */
export function ReviewPackageEvidenceDensityStrip(
  props: ReviewPackageEvidenceDensityStripProps,
): React.JSX.Element {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-700",
        OPERATOR_LAYOUT.cardPadding,
        props.className,
      )}
      data-testid="review-package-evidence-density-strip"
      role="status"
    >
      <span className={cn(OPERATOR_TYPOGRAPHY.helper, "font-medium text-al-text-secondary")}>Evidence basis</span>
      <dl className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1">
        <div className="inline-flex items-baseline gap-1">
          <dt className={cn(OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}>Findings</dt>
          <dd className={cn("m-0 tabular-nums", OPERATOR_TYPOGRAPHY.dataValue)}>{countDisplay(props.findingCount)}</dd>
        </div>
        <div className="inline-flex items-baseline gap-1">
          <dt className={cn(OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}>Evidence links</dt>
          <dd className={cn("m-0 tabular-nums", OPERATOR_TYPOGRAPHY.dataValue)}>{props.evidenceArtifactCount}</dd>
        </div>
        {props.policiesCheckedLabel !== null ? (
          <div className="inline-flex items-baseline gap-1">
            <dt className={cn(OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}>Policies</dt>
            <dd className={cn("m-0", OPERATOR_TYPOGRAPHY.dataValue)}>{props.policiesCheckedLabel}</dd>
          </div>
        ) : null}
      </dl>
      {props.governanceApprovalLabel !== null ? (
        <StatusTag kind="neutral" label={props.governanceApprovalLabel} />
      ) : null}
      {props.auditTrailHref !== null ? (
        <Link
          href={props.auditTrailHref}
          className={cn(OPERATOR_TYPOGRAPHY.helper, "ml-auto font-medium text-al-accent-interactive underline underline-offset-2")}
        >
          View audit trail
        </Link>
      ) : null}
    </div>
  );
}
