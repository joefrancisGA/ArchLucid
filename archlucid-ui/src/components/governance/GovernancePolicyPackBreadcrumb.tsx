import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { GOVERNANCE_APPROVAL_QUEUE_PATH, GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";

export type GovernancePolicyPackBreadcrumbProps = {
  readonly packLabel: string;
};

/** Ancestor trail for policy pack detail: Policy packs → current pack (GPI). */
export function GovernancePolicyPackBreadcrumb(props: GovernancePolicyPackBreadcrumbProps): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <OperatorPageBreadcrumb
      data-testid="governance-policy-pack-breadcrumb"
      items={
        buyerPolishedShell
          ? [
              { label: "Approval", href: GOVERNANCE_APPROVAL_QUEUE_PATH },
              { label: "Policy packs", href: GOVERNANCE_POLICY_PACKS_PATH },
              { label: props.packLabel },
            ]
          : [
              { label: "Policy packs", href: GOVERNANCE_POLICY_PACKS_PATH },
              { label: props.packLabel },
            ]
      }
    />
  );
}
