import { ApiV1Routes } from "@/lib/api-v1-routes";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { governanceActivationsBlockedReason, governanceEnvironmentCatalogBlockedReason } from "@/lib/governance/governance-workflow-read-blocked-reason";
import { governanceEnvironmentCatalogMutationBlockedReason } from "@/lib/governance/governance-environment-catalog-mutation-blocked-reason";
import { governanceWorkflowMutationBlockedReason } from "@/lib/governance/governance-workflow-mutation-blocked-reason";

import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { GovernanceEnvironmentActivation } from "@/types/governance-workflow";
import type {
  GovernanceEnvironmentCatalog,
  ReplaceGovernanceEnvironmentCatalogRequest,
} from "@/types/governance-environment-catalog";
import { shouldSkipLiveAuthorityRunScopedApi } from "@/lib/operator-static-demo/run-scoped-live-api";
import { apiGet, apiPostJson, apiPutJson } from "./http";

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

  try {
    return await apiPostJson<GovernanceEnvironmentActivation>(`${governanceBase()}/activations`, {
      runId: body.runId,
      manifestVersion: body.manifestVersion,
      environment: body.environment,
    });
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = governanceWorkflowMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Lists environment activation rows for a run. */
export async function listActivations(runId: string): Promise<GovernanceEnvironmentActivation[]> {
  if (shouldSkipLiveAuthorityRunScopedApi(runId)) {
    return [];
  }

  try {
    return await apiGet<GovernanceEnvironmentActivation[]>(
      `${governanceBase()}/runs/${encodeURIComponent(runId)}/activations`,
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
    return await apiGet<GovernanceEnvironmentCatalog>(`${governanceBase()}/environment-catalog`);
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
  try {
    return await apiPutJson<GovernanceEnvironmentCatalog>(`${governanceBase()}/environment-catalog`, body);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = governanceEnvironmentCatalogMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
