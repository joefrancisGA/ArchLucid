import Link from "next/link";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_LINK } from "@/lib/design-tokens";
import { isStoredPolicyRuleId } from "@/lib/policy/policy-rule-preview-lookup";
import { policyPacksRuleHref } from "@/lib/policy/policy-packs-deep-link";
import { cn } from "@/lib/utils";

export type FindingPolicyRuleBadgeProps = {
  readonly policyRuleId: string;
  readonly policyRuleLabel?: string | null;
  readonly className?: string;
  readonly onPreviewClick?: () => void;
};

/** Visible proof that a finding maps to a curated policy-pack compliance rule key. */
export function FindingPolicyRuleBadge(props: FindingPolicyRuleBadgeProps): React.JSX.Element | null {
  const ruleId = props.policyRuleId.trim();

  if (ruleId.length === 0) {
    return null;
  }

  const labelSource =
    props.policyRuleLabel !== null &&
    props.policyRuleLabel !== undefined &&
    props.policyRuleLabel.trim().length > 0
      ? props.policyRuleLabel.trim()
      : null;

  const storedRuleId = isStoredPolicyRuleId(ruleId);

  const statusLabel =
    !storedRuleId && labelSource !== null
      ? `Rule label: ${labelSource} (rule id was not stored)`
      : labelSource !== null && labelSource !== ruleId
        ? `Rule ${ruleId}: ${labelSource}`
        : storedRuleId
          ? `Rule: ${ruleId}`
          : "Rule id was not stored.";

  if (props.onPreviewClick !== undefined) {
    return (
      <button
        type="button"
        className={props.className}
        data-testid="finding-policy-rule-badge"
        onClick={props.onPreviewClick}
      >
        <StatusTag kind="in-progress" label={statusLabel} />
      </button>
    );
  }

  return (
    storedRuleId ? (
    <Link
      href={policyPacksRuleHref(ruleId)}
      className={cn(OPERATOR_LINK.inline, props.className)}
      data-testid="finding-policy-rule-badge"
    >
      <StatusTag kind="in-progress" label={statusLabel} />
    </Link>
    ) : (
      <span className={props.className} data-testid="finding-policy-rule-badge">
        <StatusTag kind="in-progress" label={statusLabel} />
      </span>
    )
  );
}
