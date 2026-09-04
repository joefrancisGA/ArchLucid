import { ApiV1Routes } from "@/lib/api-v1-routes";
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
import { apiGet } from "./http";

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

/** Lists bundled platform policy packs and global activation flags (internal admin). */
export async function listPlatformBundledPolicyPacks(): Promise<PlatformBundledPolicyPackRegistryEntry[]> {
  return apiGet("/v1/admin/platform-bundled-policy-packs");
}
