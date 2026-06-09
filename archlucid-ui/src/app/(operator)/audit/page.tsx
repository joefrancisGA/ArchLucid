import { Suspense } from "react";

import { AuditPageClient } from "./_sections/AuditPageClient";
import { loadAuditPageData } from "./_sections/load-audit-page-data";

export default async function AuditPage() {
  const loaded = await loadAuditPageData();

  return (
    <Suspense fallback={null}>
      <AuditPageClient loaded={loaded} />
    </Suspense>
  );
}
