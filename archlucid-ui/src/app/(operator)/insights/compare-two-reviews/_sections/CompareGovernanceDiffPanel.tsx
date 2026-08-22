import { cn } from "@/lib/utils";
import type { ReactElement } from "react";
import Link from "next/link";

import { StatusTag } from "@/components/ui/status-tag";
import { DeferredChunkLoading } from "@/components/ui/deferred-chunk-loading";
import {
  COMPARE_GOVERNANCE_CURRENT_EFFECTIVE_DISCLAIMER,
  type CompareEffectiveGovernanceAtCommitSnapshot,
  type CompareGovernanceDiffView,
  type CompareManifestGovernanceSnapshot,
} from "@/lib/compare-effective-governance-diff";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { governancePolicyPackDetailPath } from "@/lib/governance/governance-route-paths";
import { policyPackBuyerGovernanceDetailHref } from "@/lib/policy/policy-pack-buyer-label";
import { POLICY_PACK_CLOUD_MISMATCH_MESSAGE } from "@/lib/review-quality/review-intake-quality-gates";

export type CompareGovernanceDiffPanelProps = {
  readonly view: CompareGovernanceDiffView | null;
  readonly loading: boolean;
  readonly softFailureMessage: string | null;
  readonly hideCurrentEffectiveDisclaimer?: boolean;
  readonly baselineCloudMismatchDetail?: string | null;
  readonly targetCloudMismatchDetail?: string | null;
};

function formatRuleSetLabel(ruleSetId: string | null, ruleSetVersion: string | null): string {
  if (ruleSetId === null) {
    return " — ";
  }

  if (ruleSetVersion !== null && ruleSetVersion.length > 0) {
    return `${ruleSetId} v${ruleSetVersion}`;
  }

  return ruleSetId;
}

function renderAtCommitSnapshot(
  label: string,
  manifest: CompareManifestGovernanceSnapshot,
  testIdPrefix: string,
): ReactElement {
  const snapshot: CompareEffectiveGovernanceAtCommitSnapshot | null = manifest.atCommit;

  if (snapshot === null) {
    return (
      <div
        className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800"
        data-testid={`${testIdPrefix}-no-at-commit`}
      >
        <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{label}</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          No policy-at-commit snapshot on this package (committed before snapshot metadata shipped, or no effective policy at commit).
        </p>
      </div>
    );
  }

  if (!snapshot.hasEffectivePolicy) {
    return (
      <div
        className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800"
        data-testid={`${testIdPrefix}-empty-at-commit`}
      >
        <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{label}</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Policy at commit: no effective policy pack assignments or compliance rule keys were recorded.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800"
      data-testid={`${testIdPrefix}-at-commit`}
    >
      <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{label}</p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Policy at commit · {snapshot.packAssignments.length} pack assignment(s) · {snapshot.complianceRuleKeyCount} compliance rule key(s)
        {snapshot.conflictCount > 0 ? ` · ${snapshot.conflictCount} merge conflict(s)` : null}
      </p>
      {snapshot.packAssignments.length > 0 ? (
        <ul className="m-0 mt-2 list-none space-y-1 p-0">
          {snapshot.packAssignments.map((row) => {
            const packHref =
              policyPackBuyerGovernanceDetailHref(row.policyPackId) ??
              governancePolicyPackDetailPath(row.policyPackId);

            return (
              <li
                key={`${row.policyPackId}-${row.policyPackVersion}-${row.scopeLevel}`}
                className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
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
    </div>
  );
}

/**
 * Surfaces effective governance delta between compared committed reviews.
 * Uses persisted policy-at-commit snapshots when present; current effective scope is labeled separately.
 */
export function CompareGovernanceDiffPanel(props: CompareGovernanceDiffPanelProps): ReactElement | null {
  const { view, loading, softFailureMessage } = props;

  if (loading) {
    return (
      <DeferredChunkLoading
        label="Loading policy pack basis for this comparison…"
        variant="panel"
        testId="compare-governance-diff-loading"
        className="mt-6"
      />
    );
  }

  if (view === null) {
    return null;
  }

  const hasAnyAtCommit = view.baselineManifest.atCommit !== null || view.targetManifest.atCommit !== null;

  return (
    <section
      id="compare-governance-diff"
      aria-labelledby="compare-governance-diff-heading"
      className="mt-6 rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid="compare-governance-diff-panel"
    >
      <h2
        id="compare-governance-diff-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        Policy pack diff
      </h2>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Policy pack basis and compliance rule keys for approval and compliance buyers — alongside the manifest structural diff above.
      </p>

      {view.usesCurrentEffectiveOnly && props.hideCurrentEffectiveDisclaimer !== true ? (
        <p
          className={cn("m-0 mt-3", DESIGN_TOKENS.callout.warn, "p-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="compare-governance-current-effective-disclaimer"
        >
          {COMPARE_GOVERNANCE_CURRENT_EFFECTIVE_DISCLAIMER}
        </p>
      ) : null}

      {softFailureMessage !== null ? (
        <p className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="compare-governance-soft-failure">
          Some policy inputs could not be loaded ({softFailureMessage}). Showing partial results.
        </p>
      ) : null}

      <dl className="m-0 mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800">
          <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Baseline review rule set</dt>
          <dd className={cn("m-0 mt-1 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {formatRuleSetLabel(view.baselineManifest.ruleSetId, view.baselineManifest.ruleSetVersion)}
          </dd>
          {props.baselineCloudMismatchDetail !== null && props.baselineCloudMismatchDetail !== undefined ? (
            <p
              className={cn("m-0 mt-2 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="compare-governance-baseline-cloud-mismatch"
            >
              {POLICY_PACK_CLOUD_MISMATCH_MESSAGE} {props.baselineCloudMismatchDetail}
            </p>
          ) : null}
        </div>
        <div className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800">
          <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Updated review rule set</dt>
          <dd className={cn("m-0 mt-1 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {formatRuleSetLabel(view.targetManifest.ruleSetId, view.targetManifest.ruleSetVersion)}
          </dd>
          {props.targetCloudMismatchDetail !== null && props.targetCloudMismatchDetail !== undefined ? (
            <p
              className={cn("m-0 mt-2 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="compare-governance-target-cloud-mismatch"
            >
              {POLICY_PACK_CLOUD_MISMATCH_MESSAGE} {props.targetCloudMismatchDetail}
            </p>
          ) : null}
        </div>
      </dl>

      {view.manifestRuleSetChanges.length > 0 ? (
        <ul className="m-0 mt-3 list-none space-y-2 p-0" data-testid="compare-governance-rule-set-changes">
          {view.manifestRuleSetChanges.map((change) => (
            <li
              key={change.field}
              className="rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40"
            >
              <StatusTag kind="needs-attention" label={`Changed ${change.field}`} />
              <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {change.baselineValue ?? " — "} → {change.targetValue ?? " — "}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="compare-governance-no-rule-set-change">
          Committed reviews share the same policy pack rule set basis.
        </p>
      )}

      {hasAnyAtCommit ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2" data-testid="compare-governance-at-commit-section">
          {renderAtCommitSnapshot("Baseline policy at commit", view.baselineManifest, "compare-governance-baseline")}
          {renderAtCommitSnapshot("Updated policy at commit", view.targetManifest, "compare-governance-target")}
        </div>
      ) : null}

      {view.currentEffective !== null ? (
        <div className="mt-4 space-y-2" data-testid="compare-governance-current-effective">
          <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            Current scope effective assignments ({view.currentEffective.packAssignments.length})
          </p>
          <ul className="m-0 list-none space-y-1 p-0">
            {view.currentEffective.packAssignments.map((row) => (
              <li key={row.policyPackId} className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                <code className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{row.policyPackId}</code> · {row.name} · v{row.version}
              </li>
            ))}
          </ul>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Compliance rule keys in current effective merge:{" "}
            <strong>{view.currentEffective.complianceRuleKeyCount}</strong>
            {view.materialComplianceRuleKeyChanges.length > 0
              ? ` · ${view.materialComplianceRuleKeyChanges.length} key delta(s) in comparison view`
              : null}
          </p>
        </div>
      ) : null}
    </section>
  );
}
