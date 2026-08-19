"use client";

import { AuditPageView } from "./AuditPageView";
import type { AuditPageServerLoad } from "./load-audit-page-data";
import { useAuditPage } from "./use-audit-page";

type AuditPageClientProps = {
  readonly loaded: AuditPageServerLoad;
};

/** Client shell for `/audit`: search/export orchestration with server-hydrated event-type catalog when available. */
export function AuditPageClient(props: AuditPageClientProps) {
  return <AuditPageView {...useAuditPage(props.loaded)} />;
}
