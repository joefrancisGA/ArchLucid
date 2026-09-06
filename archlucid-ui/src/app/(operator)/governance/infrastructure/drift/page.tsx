import type { Metadata } from "next";

import { DriftWorkbenchClient } from "@/app/(operator)/governance/infrastructure/drift/DriftWorkbenchClient";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const metadata: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.infrastructureDrift,
};

/** IE-UX-01 drift workbench — snapshot compare, change rows, advisory Terraform export. */
export default function InfrastructureDriftPage() {
  return <DriftWorkbenchClient />;
}
