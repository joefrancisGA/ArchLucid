import { cn } from "@/lib/utils";
import { Suspense } from "react";

import { AuditPageClient } from "./_sections/AuditPageClient";
import { loadAuditPageData } from "./_sections/load-audit-page-data";
import { AUDIT_TRAIL_PAGE_TITLE } from "@/lib/audit-trail-page-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export default async function AuditPage() {
  const loaded = await loadAuditPageData();

  return (
    <Suspense
      fallback={
        <header className="mb-6 border-b border-neutral-200 pb-4 dark:border-neutral-800">
          <h1
            className={cn("m-0 text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.pageTitle)}
            data-testid="audit-page-title"
          >
            {AUDIT_TRAIL_PAGE_TITLE}
          </h1>
          <p
            className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="audit-page-suspense-fallback"
          >
            Loading audit trail…
          </p>
        </header>
      }
    >
      <AuditPageClient loaded={loaded} />
    </Suspense>
  );
}
