"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";

import { StatusTag } from "@/components/ui/status-tag";

export type GovernanceBlockExplainerProps = {
  readonly reason: string;
  readonly policyRuleId?: string | null;
  readonly remediationHref?: string;
};

/** Inline explainer when governance or quality gates block an action. */
export function GovernanceBlockExplainer(props: GovernanceBlockExplainerProps): React.JSX.Element {
  const { reason, policyRuleId, remediationHref } = props;

  return (
    <div
      className={cn("rounded-md border border-amber-600/35 bg-neutral-50 px-3 py-2 dark:border-amber-700/45 dark:bg-neutral-900", OPERATOR_TYPOGRAPHY.body)}
      data-testid="governance-block-explainer"
      role="alert"
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusTag kind="blocked" label="Blocked" />
        <span className="font-medium text-neutral-900 dark:text-neutral-100">Governance gate</span>
      </div>
      <p className="m-0 mt-2 text-neutral-700 dark:text-neutral-300">{reason}</p>
      {policyRuleId !== null && policyRuleId !== undefined && policyRuleId.trim().length > 0 ? (
        <p className={cn("m-0 mt-1 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
          Policy rule: <span className="font-mono">{policyRuleId}</span>
        </p>
      ) : null}
      {remediationHref !== undefined ? (
        <Link href={remediationHref} className={cn("mt-2 inline-block font-medium text-teal-800 underline dark:text-teal-300", OPERATOR_TYPOGRAPHY.body)}>
          Review effective policy →
        </Link>
      ) : null}
    </div>
  );
}
