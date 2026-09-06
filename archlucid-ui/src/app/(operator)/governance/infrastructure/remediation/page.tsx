import type { Metadata } from "next";

import { RemediationWorkbenchClient } from "@/app/(operator)/governance/infrastructure/remediation/RemediationWorkbenchClient";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const metadata: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.infrastructureRemediation,
};

/** IE-UX-05 remediation factory workbench — instance lifecycle with advisory-only execute honesty. */
export default function InfrastructureRemediationPage() {
  return <RemediationWorkbenchClient />;
}
