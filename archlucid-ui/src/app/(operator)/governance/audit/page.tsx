import { Suspense } from "react";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { AuditPageClient } from "./_sections/AuditPageClient";
import { loadAuditPageData } from "./_sections/load-audit-page-data";
import { AUDIT_TRAIL_PAGE_TITLE } from "@/lib/audit-trail-page-copy";

export default async function AuditPage() {
  const loaded = await loadAuditPageData();

  return (
    <Suspense
      fallback={
        <OperatorPageHeader
          title={AUDIT_TRAIL_PAGE_TITLE}
          titleTestId="audit-page-title"
          headingLevel="h1"
          subtitle="Loading audit trail…"
          subtitleTestId="audit-page-suspense-fallback"
        />
      }
    >
      <AuditPageClient loaded={loaded} />
    </Suspense>
  );
}
