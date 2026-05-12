"use client";

import { AuditPageView } from "./AuditPageView";
import { useAuditPage } from "./use-audit-page";

/** Client entry for the audit route; keeps `page.tsx` as a thin server wrapper. */
export function AuditPageMain() {
  return <AuditPageView {...useAuditPage()} />;
}
