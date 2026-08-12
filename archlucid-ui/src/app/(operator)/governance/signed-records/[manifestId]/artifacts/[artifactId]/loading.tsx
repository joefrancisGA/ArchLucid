import Link from "next/link";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_LINK } from "@/lib/design-tokens";
import { SIGNED_RECORD_ARTIFACT_PAGE_TITLE } from "@/lib/signed-record-artifact-page-copy";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

export default function SignedRecordArtifactLoading(): React.JSX.Element {
  return (
    <div
      className="w-full max-w-[1200px] space-y-4 px-1 py-6 sm:px-0"
      data-testid="signed-record-artifact-loading-shell"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <OperatorPageHeader
        title={SIGNED_RECORD_ARTIFACT_PAGE_TITLE}
        headingLevel="h1"
        subtitle="Loading artifact preview…"
        breadcrumb={
          <nav aria-label="Breadcrumb">
            <Link className={OPERATOR_LINK.nav} href={SIGNED_RECORDS_LIST_PATH}>
              Signed review records
            </Link>
          </nav>
        }
      />
    </div>
  );
}
