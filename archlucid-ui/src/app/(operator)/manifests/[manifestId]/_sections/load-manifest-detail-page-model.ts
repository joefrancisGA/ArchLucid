import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { isApiNotFoundFailure, toApiLoadFailure } from "@/lib/api-load-failure";
import { getManifestSummary, listArtifacts } from "@/lib/api";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  coerceArtifactDescriptorList,
  coerceManifestSummary,
} from "@/lib/operator-response-guards";
import { tryStaticDemoArtifacts, tryStaticDemoManifestSummary } from "@/lib/operator-static-demo";
import { tryLoadRunExecutionFootnote } from "@/lib/try-load-run-execution-footnote";
import type { ArtifactDescriptor, ManifestSummary } from "@/types/authority";

import type { ManifestDetailPageSuccessModel } from "./manifest-detail-page-model";

export type LoadManifestDetailPageModelResult =
  | { kind: "not-found" }
  | { kind: "summary-error"; buyerPolishedLayout: boolean; summaryFailure: ApiLoadFailureState }
  | { kind: "summary-malformed"; buyerPolishedLayout: boolean; message: string }
  | { kind: "summary-missing"; buyerPolishedLayout: boolean }
  | { kind: "success"; model: ManifestDetailPageSuccessModel };

/** Loads manifest summary + artifacts (with static demo fallbacks) for the manifest route. */
export async function loadManifestDetailPageModel(manifestId: string): Promise<LoadManifestDetailPageModelResult> {
  const buyerPolishedLayout = isBuyerPolishedOperatorShellEnv();

  let summary: ManifestSummary | null = null;
  let artifacts: ArtifactDescriptor[] = [];
  let summaryFailure: ApiLoadFailureState | null = null;
  let artifactsFailure: ApiLoadFailureState | null = null;
  let summaryMalformed: string | null = null;
  let artifactsMalformed: string | null = null;
  let usedStaticDemoManifest = false;

  try {
    const rawSummary: unknown = await getManifestSummary(manifestId);
    const coercedSummary = coerceManifestSummary(rawSummary);

    if (!coercedSummary.ok) {
      summaryMalformed = coercedSummary.message;
    } else {
      summary = coercedSummary.value;
    }
  } catch (e) {
    summaryFailure = toApiLoadFailure(e);
  }

  const staticSummaryFallback =
    summary === null ? tryStaticDemoManifestSummary(manifestId) : null;

  if (staticSummaryFallback !== null) {
    summary = staticSummaryFallback;
    summaryFailure = null;
    summaryMalformed = null;
    usedStaticDemoManifest = true;
  }

  if (summaryFailure !== null && isApiNotFoundFailure(summaryFailure)) {
    return { kind: "not-found" };
  }

  try {
    const rawArtifacts: unknown = await listArtifacts(manifestId);
    const coercedArtifacts = coerceArtifactDescriptorList(rawArtifacts);

    if (!coercedArtifacts.ok) {
      artifacts = [];
      artifactsMalformed = coercedArtifacts.message;
    } else {
      artifacts = coercedArtifacts.items;
    }
  } catch (e) {
    artifactsFailure = toApiLoadFailure(e);
    const staticArtifacts =
      summary !== null ? tryStaticDemoArtifacts(summary.runId, manifestId) : null;

    if (staticArtifacts !== null) {
      artifacts = staticArtifacts;
      artifactsFailure = null;
      artifactsMalformed = null;
    }
  }

  if (summaryFailure) {
    return {
      kind: "summary-error",
      buyerPolishedLayout,
      summaryFailure,
    };
  }

  if (summaryMalformed) {
    return {
      kind: "summary-malformed",
      buyerPolishedLayout,
      message: summaryMalformed,
    };
  }

  if (!summary) {
    return { kind: "summary-missing", buyerPolishedLayout };
  }

  const manifestFooterExecution = await tryLoadRunExecutionFootnote(summary.runId.trim());

  const model: ManifestDetailPageSuccessModel = {
    manifestId,
    buyerPolishedLayout,
    summary,
    artifacts,
    artifactsFailure,
    artifactsMalformed,
    usedStaticDemoManifest,
    manifestFooterExecution,
  };

  return { kind: "success", model };
}
