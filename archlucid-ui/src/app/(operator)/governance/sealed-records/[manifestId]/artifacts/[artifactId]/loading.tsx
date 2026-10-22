import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { SIGNED_RECORD_ARTIFACT_CLAIM_DISCIPLINE } from "@/lib/signed-record-artifact-evidence-copy";
import {
  BUYER_SIGNED_RECORD_ARTIFACT_PAGE_SUBTITLE,
  SIGNED_RECORD_ARTIFACT_PAGE_TITLE,
  SIGNED_RECORD_ARTIFACT_PRIMARY_CONTENT_ID,
  SIGNED_RECORD_ARTIFACT_SKIP_LINK_LABEL,
} from "@/lib/signed-record-artifact-page-copy";

import { SignedRecordArtifactPageSkeleton } from "./_sections/SignedRecordArtifactPageSkeleton";

export default function SignedRecordArtifactLoading(): React.JSX.Element {
  const buyerPolishedLayout = isBuyerPolishedOperatorShellEnv();

  if (!buyerPolishedLayout) {
    return (
      <div
        className="w-full max-w-[1200px] space-y-4 px-1 py-2 sm:px-0"
        data-testid="signed-record-artifact-loading-shell"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <OperatorPageHeader
          title={SIGNED_RECORD_ARTIFACT_PAGE_TITLE}
          headingLevel="h1"
          subtitle="Loading artifact preview…"
        />
        <SignedRecordArtifactPageSkeleton />
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-[1200px] space-y-4 px-1 py-2 sm:px-0"
      data-testid="signed-record-artifact-loading-shell"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <a
        href={`#${SIGNED_RECORD_ARTIFACT_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {SIGNED_RECORD_ARTIFACT_SKIP_LINK_LABEL}
      </a>
      <OperatorPageHeader
        title={SIGNED_RECORD_ARTIFACT_PAGE_TITLE}
        headingLevel="h1"
        subtitle={BUYER_SIGNED_RECORD_ARTIFACT_PAGE_SUBTITLE}
        claimDiscipline={SIGNED_RECORD_ARTIFACT_CLAIM_DISCIPLINE}
        claimDisciplineTestId="signed-record-artifact-claim-discipline"
      />
      <SignedRecordArtifactPageSkeleton />
    </div>
  );
}
