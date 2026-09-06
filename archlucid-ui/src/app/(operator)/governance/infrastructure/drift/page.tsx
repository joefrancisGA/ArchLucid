import type { Metadata } from "next";

import { InfrastructureWorkbenchStub } from "@/app/(operator)/governance/infrastructure/_sections/InfrastructureWorkbenchStub";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const metadata: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.infrastructureDrift,
};

/** IE-UX-00 stub — drift workbench ships in IE-UX-01. */
export default function InfrastructureDriftPage() {
  return (
    <InfrastructureWorkbenchStub
      pageKey="infrastructure-drift"
      shippedInBatch="IE-UX-01"
      lead="Compare inventory snapshots, review drift classifications, and export advisory Terraform from one workbench."
    />
  );
}
