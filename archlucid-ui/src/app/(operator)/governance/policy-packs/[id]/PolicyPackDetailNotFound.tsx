import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";

import {
  buildPolicyPackDetailNotFoundBody,
  RESPONSIBLE_AI_ACTION_OPEN_GOVERNANCE_SETUP,
  RESPONSIBLE_AI_ACTION_OPEN_LIBRARY,
  RESPONSIBLE_AI_POLICY_PACK_NOT_FOUND_TITLE,
} from "@/lib/responsible-ai-policy-pack-detail-content";

type PolicyPackDetailNotFoundProps = {
  readonly policyPackId: string;
};

export function PolicyPackDetailNotFound(props: PolicyPackDetailNotFoundProps): React.JSX.Element {
  const { policyPackId } = props;

  return (
    <div className="p-4" data-testid="policy-pack-detail-not-found">
      <EnterpriseCompactEmptyState
        testId="policy-pack-not-found-empty-state"
        title={RESPONSIBLE_AI_POLICY_PACK_NOT_FOUND_TITLE}
        description={buildPolicyPackDetailNotFoundBody(policyPackId)}
        actions={[
          { label: RESPONSIBLE_AI_ACTION_OPEN_LIBRARY, href: GOVERNANCE_POLICY_PACKS_PATH, variant: "primary" },
          { label: RESPONSIBLE_AI_ACTION_OPEN_GOVERNANCE_SETUP, href: "/governance/approval-queue", variant: "outline" },
        ]}
      />
    </div>
  );
}
