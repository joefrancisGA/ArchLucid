import { ApiV1Routes } from "@/lib/api-v1-routes";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { governanceActivationsBlockedReason, governanceEnvironmentCatalogBlockedReason } from "@/lib/governance/governance-workflow-read-blocked-reason";
import { governanceEnvironmentCatalogMutationBlockedReason } from "@/lib/governance/governance-environment-catalog-mutation-blocked-reason";
import { governanceWorkflowMutationBlockedReason } from "@/lib/governance/governance-workflow-mutation-blocked-reason";

import { rethrowLivelihoodMutate401 } from "@/lib/auth/livelihood-mutation-api-error";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { GovernanceEnvironmentActivation } from "@/types/governance-workflow";
import { shouldSkipLiveAuthorityRunScopedApi } from "@/lib/operator-static-demo/run-scoped-live-api";
import {
  encodeRequiredPathSegment,
  trimRequiredPathSegment,
  trimRequiredText,
  trimTextFields,
} from "./api-boundary-normalization";
import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import { apiPostJson, apiPutJson } from "./http";

import type {
  GovernanceEnvironmentCatalog,
  ReplaceGovernanceEnvironmentCatalogRequest,
} from "@/types/governance-environment-catalog";

const governanceBase = (): string => `/${ApiV1Routes.governance}`;

/**
 * Activates a run/manifest as the baseline for an environment.
 * `activatedBy` is part of the UI contract for operator context; the API derives the actor from auth.
 */
export async function activateEnvironment(body: {
  runId: string;
  manifestVersion: string;
  environment: string;
  activatedBy: string;
}): Promise<GovernanceEnvironmentActivation> {
  void body.activatedBy;

  const normalizedBody = trimTextFields(body, ["runId", "manifestVersion", "environment", "activatedBy"]);

  try {
    return await apiPostJson<GovernanceEnvironmentActivation>(`${governanceBase()}/activations`, {
      runId: trimRequiredText(normalizedBody.runId, "runId"),
      manifestVersion: trimRequiredText(normalizedBody.manifestVersion, "manifestVersion"),
      environment: trimRequiredText(normalizedBody.environment, "environment"),
    });
  } catch (error: unknown) {
    rethrowLivelihoodMutate401(error);
    const failure = toApiLoadFailure(error);
    const blockedReason = governanceWorkflowMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Lists environment activation rows for a run. */
export async function listActivations(runId: string): Promise<GovernanceEnvironmentActivation[]> {
  const normalizedRunId = trimRequiredPathSegment(runId, "runId");

  if (shouldSkipLiveAuthorityRunScopedApi(normalizedRunId)) {
    return [];
  }

  try {
    return await apiGetSealedManifestAware<GovernanceEnvironmentActivation[]>(
      `${governanceBase()}/runs/${encodeRequiredPathSegment(runId, "runId")}/activations`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = governanceActivationsBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Returns the administrator-defined governance environment catalog for the current scope. */
export async function fetchGovernanceEnvironmentCatalog(): Promise<GovernanceEnvironmentCatalog> {
  try {
    return await apiGetSealedManifestAware<GovernanceEnvironmentCatalog>(`${governanceBase()}/environment-catalog`);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = governanceEnvironmentCatalogBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Replaces the governance environment catalog and allowed transitions for the current scope. */
export async function replaceGovernanceEnvironmentCatalog(
  body: ReplaceGovernanceEnvironmentCatalogRequest,
): Promise<GovernanceEnvironmentCatalog> {
  const normalizedBody: ReplaceGovernanceEnvironmentCatalogRequest = {
    ...body,
    environments: body.environments?.map((environment) => ({
      ...environment,
      slug: environment.slug?.trim() ?? "",
      displayName: environment.displayName?.trim() ?? "",
    })),
    transitions: body.transitions?.map((transition) => ({
      ...transition,
      sourceSlug: transition.sourceSlug?.trim() ?? "",
      targetSlug: transition.targetSlug?.trim() ?? "",
    })),
  };

  try {
    return await apiPutJson<GovernanceEnvironmentCatalog>(`${governanceBase()}/environment-catalog`, normalizedBody);
  } catch (error: unknown) {
    rethrowLivelihoodMutate401(error);
    const failure = toApiLoadFailure(error);
    const blockedReason = governanceEnvironmentCatalogMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
