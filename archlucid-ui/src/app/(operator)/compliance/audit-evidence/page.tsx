import type { Metadata } from "next";

import { AuditEvidenceLookupClient } from "@/app/(operator)/governance/audit-evidence/AuditEvidenceLookupClient";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const metadata: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.auditEvidenceLineage,
};

/** SecureNow audit evidence lineage lookup. */
export default function SecureNowAuditEvidenceLookupPage() {
  return <AuditEvidenceLookupClient />;
}
