"use client";

import Link from "next/link";

import { CopyIdButton } from "@/components/CopyIdButton";
import {
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_RECENT_MAPPINGS_TITLE,
} from "@/lib/governance/governance-infrastructure-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ContinueLastInfraEvidenceTerraformWorkbenchTarget } from "@/lib/resolve-continue-last-infra-evidence-terraform-workbench";
import { formatAbsoluteUpdatedAtTitle, formatRelativeTime } from "@/lib/relative-time";
import { cn } from "@/lib/utils";

export type TerraformWorkbenchRecentMappingsTableProps = {
  readonly targets: readonly ContinueLastInfraEvidenceTerraformWorkbenchTarget[];
};

function formatSnapshotShortId(snapshotId: string): string {
  const trimmed = snapshotId.trim();

  if (trimmed.length === 0) {
    return "—";
  }

  return trimmed.length > 8 ? `${trimmed.slice(0, 8)}…` : trimmed;
}

/** Compact recent Terraform mapping visits for unscoped resume. */
export function TerraformWorkbenchRecentMappingsTable(
  props: TerraformWorkbenchRecentMappingsTableProps,
): React.JSX.Element | null {
  if (props.targets.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="infra-terraform-recent-mappings-heading"
      data-testid="infra-terraform-recent-mappings-table"
    >
      <h2
        id="infra-terraform-recent-mappings-heading"
        className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {GOVERNANCE_INFRASTRUCTURE_TERRAFORM_RECENT_MAPPINGS_TITLE}
      </h2>
      <table className="mt-2 w-full max-w-3xl border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left dark:border-neutral-800">
            <th className="py-1 pr-3 font-medium">Resource</th>
            <th className="py-1 pr-3 font-medium">Snapshot</th>
            <th className="py-1 font-medium">Viewed</th>
          </tr>
        </thead>
        <tbody>
          {props.targets.map((target) => (
            <tr
              key={`${target.cloudResourceId}-${target.viewedAtUtc}`}
              className="border-b border-neutral-100 dark:border-neutral-900"
              data-testid="infra-terraform-recent-mapping-row"
            >
              <td className="py-2 pr-3">
                <Link
                  href={target.href}
                  className={cn("text-al-link hover:underline", OPERATOR_LINK.inline)}
                  data-testid="infra-terraform-recent-mapping-link"
                >
                  {target.label}
                </Link>
              </td>
              <td className="py-2 pr-3">
                <span className="inline-flex items-center gap-1 font-mono text-xs text-al-text-secondary">
                  {formatSnapshotShortId(target.snapshotId)}
                  {target.snapshotId.trim().length > 0 ? (
                    <CopyIdButton value={target.snapshotId} aria-label="Copy snapshot id" />
                  ) : null}
                </span>
              </td>
              <td className="py-2 text-al-text-secondary">
                <time dateTime={target.viewedAtUtc} title={formatAbsoluteUpdatedAtTitle(target.viewedAtUtc)}>
                  {formatRelativeTime(target.viewedAtUtc)}
                </time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
