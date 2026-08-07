import { cn } from "@/lib/utils";
import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SIGNED_RECORD_ARTIFACT_PAGE_TITLE } from "@/lib/signed-record-artifact-page-copy";

export default function SignedRecordArtifactLoading(): React.JSX.Element {
  return (
    <div
      className="w-full max-w-[1200px] space-y-4 px-1 py-6 sm:px-0"
      data-testid="signed-record-artifact-loading-shell"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <nav aria-label="Breadcrumb" className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        <Link className={OPERATOR_LINK.nav} href={SIGNED_RECORDS_LIST_PATH}>
          Signed review records
        </Link>
      </nav>
      <h1 className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{SIGNED_RECORD_ARTIFACT_PAGE_TITLE}</h1>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading artifact preview…</p>
    </div>
  );
}
