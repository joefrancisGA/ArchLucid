import { ApiV1Routes } from "@/lib/api-v1-routes";
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

  return apiPostJson<GovernanceEnvironmentActivation>(`${governanceBase()}/activations`, {
    runId: body.runId,
    manifestVersion: body.manifestVersion,
    environment: body.environment,
  });
}

/** Lists environment activation rows for a run. */
export async function listActivations(runId: string): Promise<GovernanceEnvironmentActivation[]> {
  if (shouldSkipLiveAuthorityRunScopedApi(runId)) {
    return [];
  }

  return apiGet<GovernanceEnvironmentActivation[]>(
    `${governanceBase()}/runs/${encodeURIComponent(runId)}/activations`,
  );
}

/** Returns the administrator-defined governance environment catalog for the current scope. */
export async function fetchGovernanceEnvironmentCatalog(): Promise<GovernanceEnvironmentCatalog> {
  return apiGet<GovernanceEnvironmentCatalog>(`${governanceBase()}/environment-catalog`);
}

/** Replaces the governance environment catalog and allowed transitions for the current scope. */
export async function replaceGovernanceEnvironmentCatalog(
  body: ReplaceGovernanceEnvironmentCatalogRequest,
): Promise<GovernanceEnvironmentCatalog> {
  return apiPutJson<GovernanceEnvironmentCatalog>(`${governanceBase()}/environment-catalog`, body);
}
