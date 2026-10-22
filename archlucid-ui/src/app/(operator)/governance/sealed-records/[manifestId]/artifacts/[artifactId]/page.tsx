import { notFound } from "next/navigation";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorMalformedCallout } from "@/components/operator/OperatorShellMessage";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { isInvalidDynamicRouteToken, isInvalidManifestRouteId } from "@/lib/route-dynamic-param";
import {
  SIGNED_RECORD_ARTIFACT_DESCRIPTOR_ERROR_BODY,
  SIGNED_RECORD_ARTIFACT_DESCRIPTOR_ERROR_HEADING,
  SIGNED_RECORD_ARTIFACT_NOT_FOUND_BODY,
  SIGNED_RECORD_ARTIFACT_NOT_FOUND_HEADING,
} from "@/lib/signed-record-artifact-page-copy";

import { loadSignedRecordArtifactPageModel } from "./_sections/load-signed-record-artifact-page-model";
import { SignedRecordArtifactPageErrorFrame } from "./_sections/SignedRecordArtifactPageErrorFrame";
import { SignedRecordArtifactPageView } from "./_sections/SignedRecordArtifactPageView";

/** Server signed-record artifact preview route (GAR / TB-1947). */
export default async function SignedRecordArtifactPage({
  params,
}: {
  params: Promise<{ manifestId: string; artifactId: string }>;
}): Promise<React.ReactElement> {
  const { manifestId, artifactId } = await params;

  if (isInvalidManifestRouteId(manifestId) || isInvalidDynamicRouteToken(artifactId)) {
    notFound();
  }

  const result = await loadSignedRecordArtifactPageModel(manifestId, artifactId);

  if (result.kind === "not-found") {
    return (
      <SignedRecordArtifactPageErrorFrame
        manifestId={manifestId}
        artifactId={artifactId}
        artifactType="Artifact"
        runId={null}
        buyerPolishedLayout={false}
      >
        <div data-testid="signed-record-artifact-not-found">
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{SIGNED_RECORD_ARTIFACT_NOT_FOUND_HEADING}</p>
          <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {SIGNED_RECORD_ARTIFACT_NOT_FOUND_BODY}
          </p>
        </div>
      </SignedRecordArtifactPageErrorFrame>
    );
  }

  if (result.kind === "descriptor-error") {
    return (
      <SignedRecordArtifactPageErrorFrame
        manifestId={manifestId}
        artifactId={artifactId}
        artifactType="Artifact"
        runId={null}
        buyerPolishedLayout={result.buyerPolishedLayout}
      >
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{SIGNED_RECORD_ARTIFACT_DESCRIPTOR_ERROR_HEADING}</p>
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {SIGNED_RECORD_ARTIFACT_DESCRIPTOR_ERROR_BODY}
        </p>
        <OperatorApiProblem failure={result.failure} />
      </SignedRecordArtifactPageErrorFrame>
    );
  }

  if (result.kind === "descriptor-malformed") {
    return (
      <SignedRecordArtifactPageErrorFrame
        manifestId={manifestId}
        artifactId={artifactId}
        artifactType="Artifact"
        runId={null}
        buyerPolishedLayout={result.buyerPolishedLayout}
      >
        <OperatorMalformedCallout>{result.message}</OperatorMalformedCallout>
      </SignedRecordArtifactPageErrorFrame>
    );
  }

  return <SignedRecordArtifactPageView model={result.model} />;
}
