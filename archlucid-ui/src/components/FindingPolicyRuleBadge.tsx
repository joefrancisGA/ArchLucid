import Link from "next/link";

import { StatusTag } from "@/components/ui/status-tag";
import { policyPacksRuleHref } from "@/lib/policy-packs-deep-link";

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

  const statusLabel =
    labelSource !== null && labelSource !== ruleId
      ? `Rule ${ruleId}: ${labelSource}`
      : `Rule: ${ruleId}`;

  if (props.onPreviewClick !== undefined) {
    return (
      <button
        type="button"
        className={props.className}
        data-testid="finding-policy-rule-badge"
        title={`Compliance rule key ${ruleId}`}
        onClick={props.onPreviewClick}
      >
        <StatusTag kind="in-progress" label={statusLabel} />
      </button>
    );
  }

  return (
    <Link
      href={policyPacksRuleHref(ruleId)}
      className={props.className}
      data-testid="finding-policy-rule-badge"
      title={`Compliance rule key ${ruleId}`}
    >
      <StatusTag kind="in-progress" label={statusLabel} />
    </Link>
  );
}
