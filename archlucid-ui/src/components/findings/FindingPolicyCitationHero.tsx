"use client";

import type { ReactElement } from "react";

import { FindingInspectPolicyRuleCallout } from "@/app/(operator)/architecture/reviews/[runId]/findings/[findingId]/FindingInspectPolicyRuleCallout";
import { FindingPolicyProvenancePanel } from "@/components/findings/FindingPolicyProvenancePanel";
import type { FindingPolicyEvidenceCitationModel } from "@/lib/finding-policy-evidence-citations";

export type FindingPolicyCitationHeroProps = {
  readonly model: FindingPolicyEvidenceCitationModel;
  readonly traceExcerpt?: string | null;
};

/**
 * Above-the-fold policy citation for finding detail and inspect routes — the most prominent proof of policy-aware review.
 */
export function FindingPolicyCitationHero(props: FindingPolicyCitationHeroProps): ReactElement | null {
  const { model, traceExcerpt } = props;
  const policy = model.policy;
  const pack = model.pack;

  if (policy !== null) {
    return (
      <div data-testid="finding-policy-citation-hero">
        <FindingInspectPolicyRuleCallout pack={pack} policy={policy} />
      </div>
    );
  }

  if (pack !== null || model.evidence.length > 0 || (traceExcerpt?.trim().length ?? 0) > 0) {
    return (
      <div data-testid="finding-policy-citation-hero">
        <FindingPolicyProvenancePanel model={model} traceExcerpt={traceExcerpt} variant="prominent" />
      </div>
    );
  }

  return null;
}
