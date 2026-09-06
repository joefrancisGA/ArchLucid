import type { Metadata } from "next";

import { InfrastructureAskClient } from "@/app/(operator)/governance/infrastructure/ask/InfrastructureAskClient";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const metadata: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.infrastructureAsk,
};

/** IE-UX-04 Infrastructure Ask — grounded questions with citation-backed answers. */
export default function InfrastructureAskPage() {
  return <InfrastructureAskClient />;
}
