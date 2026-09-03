import { ApiV1Routes } from "@/lib/api-v1-routes";
import type { components } from "@/lib/openapi-schemas";
import {
  POLICY_PACK_DRY_RUN_DEFAULT_PAGE_SIZE,
  POLICY_PACK_DRY_RUN_MAX_PAGE_SIZE,
  type PolicyPackDryRunRequest,
  type PolicyPackDryRunResponse,
} from "@/types/policy-pack-dry-run";
import type {
  EffectivePolicyPackSet,
  PolicyPack,
  PolicyPackAssignment,
  PolicyPackCatalogEntryDetail,
  PolicyPackCatalogListItem,
  PolicyPackContentDocument,
  PolicyPackVersion,
  PlatformBundledPolicyPackRegistryEntry,
  PolicyPackWorkspaceSelectionItem,
} from "@/types/policy-packs";
import { apiGet, apiPostJson, apiPutJson, apiPutNoContent } from "./http";

export async function listPolicyPacks(): Promise<PolicyPack[]> {
  return apiGet<PolicyPack[]>(`/${ApiV1Routes.policyPacks}`);
}

/** Policy packs hub: list, effective assignments, and merged content in one GET. */
export async function fetchPolicyPacksPageBundle(): Promise<{
  packs: PolicyPack[];
  effective: EffectivePolicyPackSet;
  effectiveContent: PolicyPackContentDocument;
}> {
  return apiGet(`/${ApiV1Routes.policyPacks}/page-bundle`);
}

/** Lists platform-promoted policy packs available to clone into the tenant. */
export async function listPolicyPackCatalog(): Promise<PolicyPackCatalogListItem[]> {
  return apiGet<PolicyPackCatalogListItem[]>(`/${ApiV1Routes.policyPacks}/catalog`);
}

/** Reads one catalog entry including snapshot JSON. */
export async function getPolicyPackCatalogEntry(
  policyPackCatalogEntryId: string,
): Promise<PolicyPackCatalogEntryDetail> {
  return apiGet<PolicyPackCatalogEntryDetail>(
    `/${ApiV1Routes.policyPacks}/catalog/${encodeURIComponent(policyPackCatalogEntryId)}`,
  );
}

/** Lists published versions for a policy pack (metadata only; ContentJson is empty). */
export async function listPolicyPackVersions(policyPackId: string): Promise<PolicyPackVersion[]> {
  return apiGet<PolicyPackVersion[]>(
    `/${ApiV1Routes.policyPacks}/${encodeURIComponent(policyPackId)}/versions`,
  );
}

/** Reads one policy pack version including full ContentJson. */
export async function getPolicyPackVersion(
  policyPackId: string,
  version: string,
): Promise<PolicyPackVersion> {
  return apiGet<PolicyPackVersion>(
    `/${ApiV1Routes.policyPacks}/${encodeURIComponent(policyPackId)}/versions/${encodeURIComponent(version)}`,
  );
}

/** Fetches the effective (resolved) set of policy packs for the current scope. */
export async function getEffectivePolicyPacks(): Promise<EffectivePolicyPackSet> {
  return apiGet<EffectivePolicyPackSet>(`/${ApiV1Routes.policyPacks}/effective`);
}

/** Fetches the merged content document from all effective policy packs. */
export async function getEffectivePolicyContent(): Promise<PolicyPackContentDocument> {
  return apiGet<PolicyPackContentDocument>(`/${ApiV1Routes.policyPacks}/effective-content`);
}

/** Creates a new policy pack with an initial content document. */
export async function createPolicyPack(body: {
  name: string;
  description?: string;
  packType: string;
  initialContentJson?: string;
}): Promise<PolicyPack> {
  return apiPostJson<PolicyPack>(`/${ApiV1Routes.policyPacks}`, body);
}

/** Publishes a new version of a policy pack with optional updated content. */
export async function publishPolicyPackVersion(
  policyPackId: string,
  body: { version: string; contentJson?: string },
): Promise<PolicyPackVersion> {
  return apiPostJson<PolicyPackVersion>(
    `/${ApiV1Routes.policyPacks}/${encodeURIComponent(policyPackId)}/publish`,
    body,
  );
}

/**
 * Dry-runs proposed threshold changes for a policy pack against a list of historic runs without
 * committing anything (POST `/v1/governance/policy-packs/{id}/dry-run`).
 */
export async function dryRunPolicyPack(
  policyPackId: string,
  body: PolicyPackDryRunRequest,
  options?: { page?: number; pageSize?: number },
): Promise<PolicyPackDryRunResponse> {
  const pageSize = clampDryRunPageSize(options?.pageSize);
  const page = clampDryRunPage(options?.page);
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });

  return apiPostJson<PolicyPackDryRunResponse>(
    `/${ApiV1Routes.policyPacks}/${encodeURIComponent(policyPackId)}/dry-run?${query.toString()}`,
    body,
  );
}

function clampDryRunPageSize(input: number | undefined): number {
  if (input === undefined || !Number.isFinite(input)) {
    return POLICY_PACK_DRY_RUN_DEFAULT_PAGE_SIZE;
  }

  if (input < 1) {
    return POLICY_PACK_DRY_RUN_DEFAULT_PAGE_SIZE;
  }

  return Math.min(Math.floor(input), POLICY_PACK_DRY_RUN_MAX_PAGE_SIZE);
}

function clampDryRunPage(input: number | undefined): number {
  if (input === undefined || !Number.isFinite(input) || input < 1) {
    return 1;
  }

  return Math.floor(input);
}

/** Assigns a specific policy pack version to the current scope (project/workspace/tenant). */
export async function assignPolicyPack(
  policyPackId: string,
  body: { version: string; scopeLevel?: string; isPinned?: boolean },
): Promise<PolicyPackAssignment> {
  return apiPostJson<PolicyPackAssignment>(
    `/${ApiV1Routes.policyPacks}/${encodeURIComponent(policyPackId)}/assign`,
    body,
  );
}

/** Lists workspace policy packs with assignment ids for tenant opt-in/opt-out. */
export async function listPolicyPackWorkspaceSelection(): Promise<PolicyPackWorkspaceSelectionItem[]> {
  return apiGet(`/${ApiV1Routes.policyPacks}/workspace-selection`);
}

/** Enables or disables one policy pack assignment for the current workspace. */
export async function setPolicyPackAssignmentEnabled(assignmentId: string, isEnabled: boolean): Promise<void> {
  await apiPutNoContent(
    `/${ApiV1Routes.policyPacks}/assignments/${encodeURIComponent(assignmentId)}/enabled`,
    { isEnabled },
  );
}

/** Lists bundled platform policy packs and global activation flags (internal admin). */
export async function listPlatformBundledPolicyPacks(): Promise<PlatformBundledPolicyPackRegistryEntry[]> {
  return apiGet("/v1/admin/platform-bundled-policy-packs");
}

/** Activates or deactivates a bundled policy pack platform-wide (internal admin). */
export async function setPlatformBundledPolicyPackActivation(
  bundleContentFile: string,
  isGloballyActive: boolean,
): Promise<PlatformBundledPolicyPackRegistryEntry> {
  return apiPutJson(
    `/v1/admin/platform-bundled-policy-packs/${encodeURIComponent(bundleContentFile)}/activation`,
    { isGloballyActive },
  );
}

/**
 * Dry-runs proposed policy pack content against a single authority run (pre-commit gate semantics).
 * Matches {@code POST /v1/policy-packs/simulate}. Requires ReadAuthority.
 */
export async function simulatePolicyPackAgainstRun(
  body: components["schemas"]["PolicyPackSimulateRequest"],
): Promise<components["schemas"]["PolicyPackGovernanceDryRunResult"]> {
  return apiPostJson<components["schemas"]["PolicyPackGovernanceDryRunResult"]>(
    `/${ApiV1Routes.policyPacks}/simulate`,
    body,
  );
}
