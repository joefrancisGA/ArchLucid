import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { isApiNotFoundFailure, toApiLoadFailure, uiFailureFromMessage } from "@/lib/api-load-failure";
import {
  fetchArtifactContentUtf8,
  getArtifactDescriptor,
  getManifestSummary,
  listArtifacts,
} from "@/lib/api";
import { isBrowser } from "@/lib/api/http";
import { prepareArtifactBodyText } from "@/lib/artifact-review-helpers";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  coerceArtifactDescriptor,
  coerceArtifactDescriptorList,
  coerceManifestSummary,
} from "@/lib/operator/operator-response-guards";
import { tryStaticDemoArtifacts, tryStaticDemoManifestSummary } from "@/lib/operator/operator-static-demo";
import { isInvalidDynamicRouteToken, isInvalidManifestRouteId } from "@/lib/route-dynamic-param";
import {
  resolveServerScopeHeadersForManifest,
  resolveServerScopeHeadersForRun,
} from "@/lib/server-run-scope";
import type { ArtifactDescriptor } from "@/types/authority";

import type { SignedRecordArtifactPageSuccessModel } from "./signed-record-artifact-page-model";

export type LoadSignedRecordArtifactPageModelResult =
  | { kind: "not-found" }
  | { kind: "descriptor-error"; buyerPolishedLayout: boolean; failure: ApiLoadFailureState }
  | { kind: "descriptor-malformed"; buyerPolishedLayout: boolean; message: string }
  | { kind: "success"; model: SignedRecordArtifactPageSuccessModel };

function findArtifactInList(
  artifacts: readonly ArtifactDescriptor[],
  artifactId: string,
): ArtifactDescriptor | null {
  const normalized = artifactId.trim();

  return artifacts.find((row) => row.artifactId === normalized) ?? null;
}

/** Loads artifact descriptor, preview body, and sibling list for the signed-record artifact route. */
export async function loadSignedRecordArtifactPageModel(
  manifestId: string,
  artifactId: string,
): Promise<LoadSignedRecordArtifactPageModelResult> {
  if (isInvalidManifestRouteId(manifestId) || isInvalidDynamicRouteToken(artifactId)) {
    return { kind: "not-found" };
  }

  const buyerPolishedLayout = isBuyerPolishedOperatorShellEnv();
  const serverManifestScopeHeaders = isBrowser() ? null : await resolveServerScopeHeadersForManifest(manifestId);
  const manifestScopeOptions =
    serverManifestScopeHeaders !== null ? { scopeHeaders: serverManifestScopeHeaders } : undefined;

  let summaryRunId: string | null = null;
  let usedStaticDemoFallback = false;

  try {
    const rawSummary: unknown = await getManifestSummary(manifestId, manifestScopeOptions);
    const coercedSummary = coerceManifestSummary(rawSummary);

    if (coercedSummary.ok) {
      summaryRunId = coercedSummary.value.runId.trim();
    }
  } catch {
    const staticSummary = tryStaticDemoManifestSummary(manifestId);

    if (staticSummary !== null) {
      summaryRunId = staticSummary.runId.trim();
      usedStaticDemoFallback = true;
    }
  }

  const artifactScopeOptions =
    isBrowser() || summaryRunId === null
      ? manifestScopeOptions
      : { scopeHeaders: await resolveServerScopeHeadersForRun(summaryRunId) };

  let descriptor: ArtifactDescriptor | null = null;
  let descriptorFailure: ApiLoadFailureState | null = null;
  let descriptorMalformed: string | null = null;

  try {
    const rawDescriptor: unknown = await getArtifactDescriptor(manifestId, artifactId);
    const coercedDescriptor = coerceArtifactDescriptor(rawDescriptor);

    if (!coercedDescriptor.ok) {
      descriptorMalformed = coercedDescriptor.message;
    } else {
      descriptor = coercedDescriptor.value;
    }
  } catch (error: unknown) {
    descriptorFailure = toApiLoadFailure(error);
  }

  let siblings: ArtifactDescriptor[] = [];

  try {
    const rawArtifacts: unknown = await listArtifacts(manifestId, artifactScopeOptions);
    const coercedArtifacts = coerceArtifactDescriptorList(rawArtifacts);

    if (coercedArtifacts.ok) {
      siblings = coercedArtifacts.items;
    }
  } catch {
    if (summaryRunId !== null) {
      const staticArtifacts = tryStaticDemoArtifacts(summaryRunId, manifestId);

      if (staticArtifacts !== null) {
        siblings = staticArtifacts;
        usedStaticDemoFallback = true;
      }
    }
  }

  if (descriptor === null) {
    descriptor = findArtifactInList(siblings, artifactId);
  }

  if (descriptor === null && summaryRunId !== null && siblings.length === 0) {
    const staticArtifacts = tryStaticDemoArtifacts(summaryRunId, manifestId);

    if (staticArtifacts !== null) {
      siblings = staticArtifacts;
      descriptor = findArtifactInList(staticArtifacts, artifactId);
      usedStaticDemoFallback = true;
    }
  }

  if (descriptor === null && descriptorFailure !== null && isApiNotFoundFailure(descriptorFailure)) {
    return { kind: "not-found" };
  }

  if (descriptorFailure !== null && descriptor === null) {
    return {
      kind: "descriptor-error",
      buyerPolishedLayout,
      failure: descriptorFailure,
    };
  }

  if (descriptorMalformed !== null && descriptor === null) {
    return {
      kind: "descriptor-malformed",
      buyerPolishedLayout,
      message: descriptorMalformed,
    };
  }

  if (descriptor === null) {
    return { kind: "not-found" };
  }

  let contentType = "application/octet-stream";
  let byteLength = 0;
  let truncated = false;
  let contentError: string | null = null;
  let prepared = prepareArtifactBodyText("", descriptor.format, descriptor.artifactType);

  try {
    const fetched = await fetchArtifactContentUtf8(manifestId, artifactId);
    contentType = fetched.contentType;
    byteLength = fetched.byteLength;
    truncated = fetched.truncated;
    prepared = prepareArtifactBodyText(fetched.text, descriptor.format, descriptor.artifactType);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    contentError = failure.message ?? uiFailureFromMessage("Artifact content could not be loaded.").message;
  }

  const runId = descriptor.runId?.trim() ?? summaryRunId;

  return {
    kind: "success",
    model: {
      manifestId,
      artifactId,
      buyerPolishedLayout,
      descriptor,
      siblings,
      prepared,
      contentType,
      byteLength,
      truncated,
      contentError,
      runId: runId !== null && runId.length > 0 ? runId : null,
      usedStaticDemoFallback,
    },
  };
}
