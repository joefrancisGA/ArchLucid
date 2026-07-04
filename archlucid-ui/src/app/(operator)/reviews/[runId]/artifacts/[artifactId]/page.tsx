import { notFound, redirect } from "next/navigation";

import { getRunDetail } from "@/lib/api";
import { isApiNotFoundFailure, toApiLoadFailure } from "@/lib/api-load-failure";
import { tryStaticDemoRunDetail } from "@/lib/operator-static-demo";
import { isInvalidDynamicRouteToken, isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";
import { signedRecordArtifactPath } from "@/lib/signed-records-paths";

/** Run-scoped artifact entry resolves golden manifest id then redirects to canonical artifact review URL. */
export default async function RunScopedArtifactReviewPage({
  params,
}: {
  params: Promise<{ runId: string; artifactId: string }>;
}) {
  const { runId, artifactId } = await params;

  if (isInvalidGuidOrSlugRouteToken(runId) || isInvalidDynamicRouteToken(artifactId)) {
    notFound();
  }

  let manifestId: string | null = null;

  try {
    const response = await getRunDetail(runId);
    manifestId = response.data.run.goldenManifestId?.trim() ?? null;
  } catch (error) {
    const demoDetail = tryStaticDemoRunDetail(runId);

    if (demoDetail !== null) {
      manifestId = demoDetail.run.goldenManifestId?.trim() ?? null;
    } else {
      const failure = toApiLoadFailure(error);

      if (isApiNotFoundFailure(failure)) {
        notFound();
      }
    }
  }

  if (manifestId === null || manifestId.length === 0) {
    redirect(`/reviews/${encodeURIComponent(runId)}#artifacts-exports`);
  }

  redirect(signedRecordArtifactPath(manifestId, artifactId));
}