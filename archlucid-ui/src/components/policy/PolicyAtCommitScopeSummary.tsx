import { cn } from "@/lib/utils";
import Link from "next/link";

import type {
  CompareEffectiveCoverageAssignmentAtCommitRow,
  CompareEffectiveGovernanceAtCommitSnapshot,
} from "@/lib/compare-effective-governance-diff";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { governancePolicyPackDetailPath } from "@/lib/governance/governance-route-paths";
import {
  buildCommittedCoverageExclusionLines,
  buildCommittedCoverageExclusionSummary,
} from "@/lib/policy/committed-coverage-scope-summary";
import { policyPackBuyerGovernanceDetailHref, policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";

export type PolicyAtCommitScopeSummaryProps = {
  readonly snapshot: CompareEffectiveGovernanceAtCommitSnapshot | null | undefined;
  readonly testIdPrefix?: string;
  readonly compact?: boolean;
};

function formatCoverageRow(row: CompareEffectiveCoverageAssignmentAtCommitRow): string {
  const packLabel = policyPackBuyerLabel(row.policyPackId, row.policyPackVersion);
  const parts = [
    packLabel,
    row.qualityDimension,
    row.exclusionReason !== null && row.exclusionReason.length > 0 ? `excluded: ${row.exclusionReason}` : null,
  ].filter((part): part is string => part !== null && part.length > 0);

  return parts.join(" · ");
}

/**
 * Lists pack assignments, quality dimensions, and exclusions frozen at commit time.
 */
export function PolicyAtCommitScopeSummary(
  props: PolicyAtCommitScopeSummaryProps,
): React.JSX.Element | null {
  const snapshot = props.snapshot;

  if (snapshot === null || snapshot === undefined) {
    return null;
  }

  const testIdPrefix = props.testIdPrefix ?? "policy-at-commit-scope";
  const packAssignments = snapshot.packAssignments ?? [];
  const coverageAssignments = snapshot.coverageAssignments ?? [];
  const exclusionSummary = buildCommittedCoverageExclusionSummary(snapshot, policyPackBuyerLabel);
  const exclusionLines = buildCommittedCoverageExclusionLines(snapshot, policyPackBuyerLabel);

  if (!snapshot.hasEffectivePolicy) {
    return (
      <p
        className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
        data-testid={`${testIdPrefix}-empty`}
      >
        Policy at commit: no effective policy pack assignments or compliance rule keys were recorded.
      </p>
    );
  }

  return (
    <div className="space-y-2" data-testid={`${testIdPrefix}-summary`}>
      <p
        className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
        data-testid={`${testIdPrefix}-counts`}
      >
        Policy at commit · {packAssignments.length} pack assignment(s) · {snapshot.complianceRuleKeyCount} compliance
        rule key(s)
        {snapshot.conflictCount > 0 ? ` · ${snapshot.conflictCount} merge conflict(s)` : null}
      </p>

      {exclusionSummary !== null ? (
        <div data-testid={`${testIdPrefix}-exclusions`}>
          <p className={cn("m-0 font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
            Excluded from assurance scope
          </p>
          <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
            {exclusionSummary}
          </p>
          {exclusionLines.length > 0 ? (
            <ul className="m-0 mt-1 list-none space-y-1 p-0">
              {exclusionLines.map((line) => (
                <li
                  key={`${line.packLabel}-${line.reason}`}
                  className={cn("text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}
                >
                  {line.packLabel} — {line.reason}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {packAssignments.length > 0 ? (
        <ul className="m-0 list-none space-y-1 p-0" data-testid={`${testIdPrefix}-packs`}>
          {packAssignments.map((row) => {
            const packHref =
              policyPackBuyerGovernanceDetailHref(row.policyPackId) ??
              governancePolicyPackDetailPath(row.policyPackId);

            return (
              <li
                key={`${row.policyPackId}-${row.policyPackVersion}-${row.scopeLevel}`}
                className={cn("text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}
              >
                <Link className={cn(OPERATOR_LINK.inline, "font-mono", OPERATOR_TYPOGRAPHY.micro)} href={packHref}>
                  {row.policyPackId}
                </Link>{" "}
                · v{row.policyPackVersion} · {row.scopeLevel}
              </li>
            );
          })}
        </ul>
      ) : null}

      {coverageAssignments.length > 0 ? (
        <div data-testid={`${testIdPrefix}-coverage`}>
          <p className={cn("m-0 font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
            Quality dimensions and coverage
          </p>
          <ul className="m-0 mt-1 list-none space-y-1 p-0">
            {coverageAssignments.map((row) => (
              <li
                key={`${row.policyPackId}-${row.coverageType}-${row.qualityDimension ?? "none"}-${row.selectionState}`}
                className={cn("text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}
              >
                {formatCoverageRow(row)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
