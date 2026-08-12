import { cn } from "@/lib/utils";
import { OperatorEmptyState } from "@/components/OperatorShellMessage";
import {
  diffComplianceRuleKeys,
  type ComplianceRuleKeyDiffItem,
} from "@/lib/policy/policy-pack-compliance-rule-key-diff";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const rowCls: Record<ComplianceRuleKeyDiffItem["changeType"], string> = {
  added: "border-emerald-700/40 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-950/20",
  removed: "border-rose-600/40 bg-rose-50/50 dark:border-rose-800/50 dark:bg-rose-950/20",
  unchanged: "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950/40",
};

function changeLabel(changeType: ComplianceRuleKeyDiffItem["changeType"]): string {
  if (changeType === "added") {
    return "Added";
  }

  if (changeType === "removed") {
    return "Removed";
  }

  return "Unchanged";
}

export type PolicyPackComplianceRuleKeyDiffViewProps = {
  readonly beforeKeys: readonly string[];
  readonly afterKeys: readonly string[];
  readonly beforeLabel?: string;
  readonly afterLabel?: string;
};

/**
 * Renders symmetric complianceRuleKey diff for policy impact preview (Tier 1 #1).
 */
export function PolicyPackComplianceRuleKeyDiffView(
  props: PolicyPackComplianceRuleKeyDiffViewProps,
): React.JSX.Element {
  const items = diffComplianceRuleKeys(props.beforeKeys, props.afterKeys);
  const changedItems = items.filter((item) => item.changeType !== "unchanged");
  const beforeLabel = props.beforeLabel ?? "Before (current effective merge)";
  const afterLabel = props.afterLabel ?? "After (proposed assignment preview)";

  return (
    <section aria-label="Compliance rule key diff" data-testid="policy-pack-compliance-rule-key-diff">
      <div className={cn("mb-3 flex flex-wrap gap-3 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        <span>
          <strong>{beforeLabel}:</strong> {props.beforeKeys.length} key(s)
        </span>
        <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-600">
          →
        </span>
        <span>
          <strong>{afterLabel}:</strong> {props.afterKeys.length} key(s)
        </span>
      </div>

      {changedItems.length === 0 ? (
        <OperatorEmptyState title="No compliance rule key changes">
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
            The before and after snapshots share the same merged compliance rule keys for this preview.
          </p>
        </OperatorEmptyState>
      ) : (
        <ul className="m-0 list-none space-y-2 p-0">
          {changedItems.map((item) => (
            <li
              key={`${item.changeType}-${item.key}`}
              className={cn("rounded-md border px-3 py-2", rowCls[item.changeType])}
              data-testid={`policy-pack-rule-key-diff-${item.changeType}`}
            >
              <p className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.badge)}>
                {changeLabel(item.changeType)}
              </p>
              <code className={cn("mt-1 block break-all", OPERATOR_TYPOGRAPHY.helper)}>{item.key}</code>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
