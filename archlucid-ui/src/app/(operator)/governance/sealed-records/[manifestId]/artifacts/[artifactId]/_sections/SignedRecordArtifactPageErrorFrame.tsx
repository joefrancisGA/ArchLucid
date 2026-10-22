import type { ReactNode } from "react";

import { GovernanceSealedRecordArtifactBreadcrumb } from "@/components/governance/GovernanceSealedRecordArtifactBreadcrumb";
import { signedRecordArtifactPageSubtitle } from "@/lib/signed-record-artifact-page-copy";

import { SignedRecordArtifactPageHeader } from "./SignedRecordArtifactPageHeader";

export type SignedRecordArtifactPageErrorFrameProps = {
  readonly manifestId: string;
  readonly artifactId: string;
  readonly artifactType: string;
  readonly runId: string | null;
  readonly buyerPolishedLayout: boolean;
  readonly children: ReactNode;
};

/** Shared chrome for artifact preview error states (breadcrumb + title). */
export function SignedRecordArtifactPageErrorFrame(
  props: SignedRecordArtifactPageErrorFrameProps,
): React.JSX.Element {
  return (
    <div className="w-full max-w-[1200px] space-y-4 px-1 py-2 sm:px-0" data-testid="signed-record-artifact-error-frame">
      <SignedRecordArtifactPageHeader
        subtitle={signedRecordArtifactPageSubtitle(props.buyerPolishedLayout)}
        breadcrumb={
          <GovernanceSealedRecordArtifactBreadcrumb
            manifestId={props.manifestId}
            artifactId={props.artifactId}
            artifactType={props.artifactType}
            runId={props.runId}
          />
        }
      />
      {props.children}
    </div>
  );
}
