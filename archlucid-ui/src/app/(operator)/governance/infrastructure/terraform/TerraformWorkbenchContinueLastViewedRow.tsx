"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_CONTINUE_LAST_ACTION,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_CONTINUE_LAST_TITLE,
} from "@/lib/governance/governance-infrastructure-copy";
import { OPERATOR_RESUME, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ContinueLastInfraEvidenceTerraformWorkbenchTarget } from "@/lib/resolve-continue-last-infra-evidence-terraform-workbench";
import { formatAbsoluteUpdatedAtTitle, formatRelativeTime } from "@/lib/relative-time";
import { cn } from "@/lib/utils";

export type TerraformWorkbenchContinueLastViewedRowProps = {
  readonly target: ContinueLastInfraEvidenceTerraformWorkbenchTarget;
};

function formatSnapshotShortId(snapshotId: string): string {
  const trimmed = snapshotId.trim();

  if (trimmed.length === 0) {
    return "default snapshot";
  }

  return trimmed.length > 8 ? `${trimmed.slice(0, 8)}…` : trimmed;
}

/** Resume the most recent scoped Terraform mapping visit from operator recent views. */
export function TerraformWorkbenchContinueLastViewedRow(
  props: TerraformWorkbenchContinueLastViewedRowProps,
): React.JSX.Element {
  const snapshotLabel = formatSnapshotShortId(props.target.snapshotId);
  const viewedLabel = formatRelativeTime(props.target.viewedAtUtc);

  return (
    <section
      aria-labelledby="infra-terraform-continue-last-heading"
      className={OPERATOR_RESUME.stripSpaced}
      data-testid="infra-terraform-continue-last-row"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="infra-terraform-continue-last-heading"
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            {GOVERNANCE_INFRASTRUCTURE_TERRAFORM_CONTINUE_LAST_TITLE}
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="font-medium text-al-text-primary">{props.target.label}</span>
            {" · "}
            Snapshot {snapshotLabel}
            {" · "}
            <time dateTime={props.target.viewedAtUtc} aria-label={`Viewed ${formatAbsoluteUpdatedAtTitle(props.target.viewedAtUtc)}`}>
              {viewedLabel}
            </time>
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          asChild
          data-testid="infra-terraform-continue-last-open"
        >
          <Link href={props.target.href}>{GOVERNANCE_INFRASTRUCTURE_TERRAFORM_CONTINUE_LAST_ACTION}</Link>
        </Button>
      </div>
    </section>
  );
}
