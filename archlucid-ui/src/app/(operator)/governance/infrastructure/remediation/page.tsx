import type { Metadata } from "next";

import { InfrastructureWorkbenchStub } from "@/app/(operator)/governance/infrastructure/_sections/InfrastructureWorkbenchStub";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const metadata: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.infrastructureRemediation,
};

/** IE-UX-00 stub — remediation factory UI ships in IE-UX-05. */
export default function InfrastructureRemediationPage() {
  return (
    <InfrastructureWorkbenchStub
      pageKey="infrastructure-remediation"
      shippedInBatch="IE-UX-05"
      lead="Track remediation instances and waves with advisory-only execute honesty — no terraform apply."
    />
  );
}
