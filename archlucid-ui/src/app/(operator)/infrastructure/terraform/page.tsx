import type { Metadata } from "next";

import { TerraformWorkbenchClient } from "@/app/(operator)/governance/infrastructure/terraform/TerraformWorkbenchClient";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const metadata: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.infrastructureTerraform,
};

/** SecureNow Terraform workbench — read-only advisory mapping with hub and drift handoffs. */
export default function SecureNowInfrastructureTerraformPage() {
  return <TerraformWorkbenchClient />;
}
