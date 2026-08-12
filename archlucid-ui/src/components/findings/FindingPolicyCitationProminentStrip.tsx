"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { ReactElement } from "react";

import { FindingPolicyTraceabilityBadges } from "@/components/findings/FindingPolicyTraceabilityBadges";
import { StatusTag } from "@/components/ui/status-tag";
import type {
  FindingPolicyCitationLink,
  FindingPolicyPackCitationLink,
} from "@/lib/findings/finding-policy-evidence-citations";

export type FindingPolicyCitationProminentStripProps = {
  readonly pack?: FindingPolicyPackCitationLink | null;
  readonly policy?: FindingPolicyCitationLink | null;
  readonly className?: string;
  readonly compact?: boolean;
};

/** Compact prominent callout: policy pack + rule badges with "triggered by" framing. */
export function FindingPolicyCitationProminentStrip(
  props: FindingPolicyCitationProminentStripProps,
): ReactElement | null {
  const pack = props.pack ?? null;
  const policy = props.policy ?? null;

  if (pack === null && policy === null) {
    return null;
  }

  const violationLabel = pack !== null ? `Policy violation: ${pack.packName}` : "Policy violation";

  return (
    <div
      className={cn(
        "rounded-lg border border-teal-300/80 bg-teal-50/90 dark:border-teal-800 dark:bg-teal-950/30",
        props.compact ? "p-2.5 space-y-1.5" : "p-3 space-y-2",
        props.className,
      )}
      data-testid="finding-policy-citation-prominent"
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusTag kind="needs-attention" label={violationLabel} data-testid="finding-policy-violation-tag" />
        <p className={cn("m-0 font-semibold uppercase tracking-wide text-teal-950 dark:text-teal-100", OPERATOR_TYPOGRAPHY.helper)}>
          Triggered by policy
        </p>
      </div>
      <FindingPolicyTraceabilityBadges pack={pack} policy={policy} />
      {!props.compact ? (
        <p className={cn("m-0 leading-snug text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
          Select a badge to preview the rule text. This finding exists because the policy rule evaluated your
          architecture evidence.
        </p>
      ) : null}
    </div>
  );
}
