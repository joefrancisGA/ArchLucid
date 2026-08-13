import { notFound } from "next/navigation";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorBrandedNotFound } from "@/components/operator/OperatorBrandedNotFound";
import { OperatorMalformedCallout } from "@/components/operator/OperatorShellMessage";
import { isInvalidDynamicRouteToken, isInvalidManifestRouteId } from "@/lib/route-dynamic-param";

import { loadSignedRecordArtifactPageModel } from "./_sections/load-signed-record-artifact-page-model";
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
      <div className="w-full max-w-[1200px] px-1 py-2 sm:px-0">
        <OperatorBrandedNotFound showProcessingHint retryLabel="Retry loading artifact" />
      </div>
    );
  }

  if (result.kind === "descriptor-error") {
    return (
      <div className="w-full max-w-[1200px] space-y-4 px-1 py-2 sm:px-0">
        <OperatorApiProblem failure={result.failure} />
      </div>
    );
  }

  if (result.kind === "descriptor-malformed") {
    return (
      <div className="w-full max-w-[1200px] space-y-4 px-1 py-2 sm:px-0">
        <OperatorMalformedCallout>{result.message}</OperatorMalformedCallout>
      </div>
    );
  }

  return <SignedRecordArtifactPageView model={result.model} />;
}
