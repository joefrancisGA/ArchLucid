"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import type { ReactElement } from "react";

import { FindingPolicyPackBadge } from "@/components/FindingPolicyPackBadge";
import { FindingPolicyRuleBadge } from "@/components/FindingPolicyRuleBadge";
import { PolicyRulePreviewDialog } from "@/components/PolicyRulePreviewDialog";
import type {
  FindingPolicyCitationLink,
  FindingPolicyPackCitationLink,
} from "@/lib/findings/finding-policy-evidence-citations";

export type FindingPolicyTraceabilityBadgesProps = {
  readonly pack?: FindingPolicyPackCitationLink | null;
  readonly policy?: FindingPolicyCitationLink | null;
  readonly className?: string;
};

/** Prominent pack + rule badges that open an inline policy rule preview dialog. */
export function FindingPolicyTraceabilityBadges(props: FindingPolicyTraceabilityBadgesProps): ReactElement | null {
  const pack = props.pack ?? null;
  const policy = props.policy ?? null;
  const [previewOpen, setPreviewOpen] = useState(false);

  if (pack === null && policy === null) {
    return null;
  }

  const ruleId = policy?.ruleId ?? "";
  const ruleLabel = policy?.ruleLabel ?? null;

  return (
    <>
      <div
        className={cn("flex flex-wrap items-center gap-2", props.className)}
        data-testid="finding-policy-traceability-badges"
      >
        {pack !== null ? (
          <FindingPolicyPackBadge
            policyPackId={pack.packId}
            policyPackLabel={pack.packName}
            onPreviewClick={() => {
              setPreviewOpen(true);
            }}
          />
        ) : null}
        {policy !== null ? (
          <FindingPolicyRuleBadge
            policyRuleId={policy.ruleId}
            policyRuleLabel={policy.ruleLabel}
            onPreviewClick={() => {
              setPreviewOpen(true);
            }}
          />
        ) : null}
      </div>

      {ruleId.trim().length > 0 ? (
        <PolicyRulePreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          ruleId={ruleId}
          ruleLabel={ruleLabel}
          packId={pack?.packId ?? null}
          packName={pack?.packName ?? null}
        />
      ) : null}
    </>
  );
}
