import { notFound, permanentRedirect } from "next/navigation";

import { isInvalidDynamicRouteToken } from "@/lib/route-dynamic-param";
import { resolveGoldenManifestIdForRun } from "@/lib/resolve-golden-manifest-id-for-run";
import { signedRecordArtifactPath } from "@/lib/signed-records-paths";

/** Run-scoped artifact preview resolves to canonical signed-record artifact URL (RER → MAM). */
export default async function RunArtifactPreviewRedirectPage({
  params,
}: {
  params: Promise<{ runId: string; artifactId: string }>;
}): Promise<never> {
  const { runId, artifactId } = await params;

  if (isInvalidDynamicRouteToken(runId) || isInvalidDynamicRouteToken(artifactId)) {
    notFound();
  }

  const manifestId = await resolveGoldenManifestIdForRun(runId);

  if (manifestId === null) {
    notFound();
  }

  permanentRedirect(signedRecordArtifactPath(manifestId, artifactId));
}
