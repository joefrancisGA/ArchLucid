import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PAGE_TITLE,
} from "@/lib/governance/governance-infrastructure-copy";
import { GOVERNANCE_INFRASTRUCTURE_PATH } from "@/lib/governance/governance-infrastructure-route-paths";

/** Terraform mapping workbench breadcrumb (ITE). */
export function TerraformBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="infra-terraform-breadcrumb"
      items={[
        { label: GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE, href: GOVERNANCE_INFRASTRUCTURE_PATH },
        { label: GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PAGE_TITLE },
      ]}
    />
  );
}
