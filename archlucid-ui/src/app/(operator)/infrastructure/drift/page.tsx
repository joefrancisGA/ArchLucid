import type { Metadata } from "next";

import { DriftWorkbenchClient } from "@/app/(operator)/governance/infrastructure/drift/DriftWorkbenchClient";
import { SECURENOW_INFRASTRUCTURE_DRIFT_LABEL } from "@/lib/product-line/securenow-infrastructure-home-copy";

export const metadata: Metadata = {
  title: SECURENOW_INFRASTRUCTURE_DRIFT_LABEL,
};

/** SecureNow drift workbench — snapshot compare, change rows, advisory Terraform export. */
export default function SecureNowInfrastructureDriftPage() {
  return <DriftWorkbenchClient />;
}
