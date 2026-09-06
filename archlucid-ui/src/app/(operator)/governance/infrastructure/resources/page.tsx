import type { Metadata } from "next";

import { InfrastructureWorkbenchStub } from "@/app/(operator)/governance/infrastructure/_sections/InfrastructureWorkbenchStub";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const metadata: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.infrastructureResources,
};

/** IE-UX-00 stub — resource hub ships in IE-UX-04. */
export default function InfrastructureResourcesPage() {
  return (
    <InfrastructureWorkbenchStub
      pageKey="infrastructure-resources"
      shippedInBatch="IE-UX-04"
      lead="Search cloud resources and open the per-resource evidence hub with drift, diagram, and finding tabs."
    />
  );
}
