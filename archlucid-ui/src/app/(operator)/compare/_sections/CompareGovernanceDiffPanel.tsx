import type { ReactElement } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import { OperatorEmptyState } from "@/components/OperatorShellMessage";
import {
  COMPARE_GOVERNANCE_CURRENT_EFFECTIVE_DISCLAIMER,
  type CompareGovernanceDiffView,
} from "@/lib/compare-effective-governance-diff";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type CompareGovernanceDiffPanelProps = {
  readonly view: CompareGovernanceDiffView | null;
  readonly loading: boolean;
  readonly softFailureMessage: string | null;
};

function formatRuleSetLabel(ruleSetId: string | null, ruleSetVersion: string | null): string {
  if (ruleSetId === null) {
    return "—";
  }

  if (ruleSetVersion !== null && ruleSetVersion.length > 0) {
    return `${ruleSetId} v${ruleSetVersion}`;
  }

  return ruleSetId;
}

/**
 * Surfaces effective governance delta between compared committed reviews.
 * Historical effective-at-commit is unavailable — manifest rule sets plus current effective scope with disclaimer.
 */
export function CompareGovernanceDiffPanel(props: CompareGovernanceDiffPanelProps): ReactElement | null {
  const { view, loading, softFailureMessage } = props;

  if (loading) {
    return (
      <OperatorEmptyState title="Effective governance">
        <p className="m-0 text-sm text-neutral-700 dark:text-neutral-300" data-testid="compare-governance-diff-loading">
          Loading policy pack basis for this comparison…
        </p>
      </OperatorEmptyState>
    );
  }

  if (view === null) {
    return null;
  }

  return (
    <aside
      aria-labelledby="compare-governance-diff-heading"
      className="mt-6 rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid="compare-governance-diff-panel"
    >
      <h3
        id="compare-governance-diff-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        Effective governance diff
      </h3>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Policy pack basis and compliance rule keys for governance buyers — alongside the manifest structural diff above.
      </p>

      {view.usesCurrentEffectiveOnly ? (
        <p
          className={cn("m-0 mt-3 rounded-md border border-amber-600/35 bg-amber-50/50 p-3 text-al-text-secondary dark:border-amber-800/45 dark:bg-amber-950/20", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="compare-governance-current-effective-disclaimer"
        >
          {COMPARE_GOVERNANCE_CURRENT_EFFECTIVE_DISCLAIMER}
        </p>
      ) : null}

      {softFailureMessage !== null ? (
        <p className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="compare-governance-soft-failure">
          Some governance inputs could not be loaded ({softFailureMessage}). Showing partial results.
        </p>
      ) : null}

      <dl className="m-0 mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800">
          <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Baseline review rule set</dt>
          <dd className={cn("m-0 mt-1 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {formatRuleSetLabel(view.baselineManifest.ruleSetId, view.baselineManifest.ruleSetVersion)}
          </dd>
        </div>
        <div className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800">
          <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Updated review rule set</dt>
          <dd className={cn("m-0 mt-1 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {formatRuleSetLabel(view.targetManifest.ruleSetId, view.targetManifest.ruleSetVersion)}
          </dd>
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
                {change.baselineValue ?? "—"} → {change.targetValue ?? "—"}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="compare-governance-no-rule-set-change">
          Committed review packages share the same policy pack rule set basis.
        </p>
      )}

      {view.currentEffective !== null ? (
        <div className="mt-4 space-y-2" data-testid="compare-governance-current-effective">
          <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            Current scope effective assignments ({view.currentEffective.packAssignments.length})
          </p>
          <ul className="m-0 list-none space-y-1 p-0">
            {view.currentEffective.packAssignments.map((row) => (
              <li key={row.policyPackId} className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                <code className="font-mono text-xs">{row.policyPackId}</code> · {row.name} · v{row.version}
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
    </aside>
  );
}
