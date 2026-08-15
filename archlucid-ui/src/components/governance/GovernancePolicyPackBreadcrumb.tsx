import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";

export type GovernancePolicyPackBreadcrumbProps = {
  readonly packLabel: string;
};

/** Ancestor trail for policy pack detail: Policy packs → current pack. */
export function GovernancePolicyPackBreadcrumb(props: GovernancePolicyPackBreadcrumbProps): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="governance-policy-pack-breadcrumb"
      items={[
        { label: "Policy packs", href: GOVERNANCE_POLICY_PACKS_PATH },
        { label: props.packLabel },
      ]}
    />
  );
}
