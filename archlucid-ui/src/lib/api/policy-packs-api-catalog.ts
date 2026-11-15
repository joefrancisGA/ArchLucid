import { ApiV1Routes } from "@/lib/api-v1-routes";
import { tryWorkbookPlatformBundledPolicyPacksDemoFallback } from "@/lib/internal/platform-bundled-policy-packs-demo-fallback";
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
import { isRecord, recordsOnly, requireRecord } from "./api-boundary-normalization";
import { apiGet } from "./http";

export async function listPolicyPacks(): Promise<PolicyPack[]> {
  return recordsOnly<PolicyPack>(await apiGet<unknown>(`/${ApiV1Routes.policyPacks}`));
}

/** Returns the effective set with a safe pack list, or null when the value is not an object. */
function effectivePolicyPackSetOrNull(value: unknown): EffectivePolicyPackSet | null {
  if (!isRecord(value)) {
    return null;
  }

  return { ...value, packs: recordsOnly(value.packs) } as EffectivePolicyPackSet;
}

/**
 * Policy packs hub: list, effective assignments, and merged content in one GET.
 * The page already handles a null effective set or content, so a malformed part becomes null
 * instead of failing the whole page.
 */
export async function fetchPolicyPacksPageBundle(): Promise<{
  packs: PolicyPack[];
  effective: EffectivePolicyPackSet | null;
  effectiveContent: PolicyPackContentDocument | null;
}> {
  const bundle = requireRecord<Record<string, unknown>>(
    await apiGet<unknown>(`/${ApiV1Routes.policyPacks}/page-bundle`),
    "Policy packs page bundle",
  );

  return {
    packs: recordsOnly<PolicyPack>(bundle.packs),
    effective: effectivePolicyPackSetOrNull(bundle.effective),
    effectiveContent: isRecord(bundle.effectiveContent)
      ? (bundle.effectiveContent as PolicyPackContentDocument)
      : null,
  };
}

/** Lists platform-promoted policy packs available to clone into the tenant. */
export async function listPolicyPackCatalog(): Promise<PolicyPackCatalogListItem[]> {
  return recordsOnly<PolicyPackCatalogListItem>(await apiGet<unknown>(`/${ApiV1Routes.policyPacks}/catalog`));
}

/** Reads one catalog entry including snapshot JSON. */
export async function getPolicyPackCatalogEntry(
  policyPackCatalogEntryId: string,
): Promise<PolicyPackCatalogEntryDetail> {
  const normalizedId = policyPackCatalogEntryId.trim();

  if (normalizedId.length === 0) {
    throw new Error("policyPackCatalogEntryId is required.");
  }

  return apiGet<PolicyPackCatalogEntryDetail>(
    `/${ApiV1Routes.policyPacks}/catalog/${encodeURIComponent(normalizedId)}`,
  );
}

/** Lists published versions for a policy pack (metadata only; ContentJson is empty). */
export async function listPolicyPackVersions(policyPackId: string): Promise<PolicyPackVersion[]> {
  const normalizedId = policyPackId.trim();

  if (normalizedId.length === 0) {
    throw new Error("policyPackId is required.");
  }

  return recordsOnly<PolicyPackVersion>(
    await apiGet<unknown>(`/${ApiV1Routes.policyPacks}/${encodeURIComponent(normalizedId)}/versions`),
  );
}

/** Reads one policy pack version including full ContentJson. */
export async function getPolicyPackVersion(
  policyPackId: string,
  version: string,
): Promise<PolicyPackVersion> {
  const normalizedId = policyPackId.trim();
  const normalizedVersion = version.trim();

  if (normalizedId.length === 0 || normalizedVersion.length === 0) {
    throw new Error("policyPackId and version are required.");
  }

  return apiGet<PolicyPackVersion>(
    `/${ApiV1Routes.policyPacks}/${encodeURIComponent(normalizedId)}/versions/${encodeURIComponent(normalizedVersion)}`,
  );
}

/** Fetches the effective (resolved) set of policy packs for the current scope. */
export async function getEffectivePolicyPacks(): Promise<EffectivePolicyPackSet> {
  return requireRecord<EffectivePolicyPackSet>(
    await apiGet<unknown>(`/${ApiV1Routes.policyPacks}/effective`),
    "Effective policy packs",
  );
}

/** Fetches the merged content document from all effective policy packs. */
export async function getEffectivePolicyContent(): Promise<PolicyPackContentDocument> {
  return requireRecord<PolicyPackContentDocument>(
    await apiGet<unknown>(`/${ApiV1Routes.policyPacks}/effective-content`),
    "Effective policy content",
  );
}

/** Lists bundled platform policy packs and global activation flags (internal admin). */
export async function listPlatformBundledPolicyPacks(): Promise<PlatformBundledPolicyPackRegistryEntry[]> {
  try {
    return await apiGet("/v1/admin/platform-bundled-policy-packs");
  } catch {
    const demoFallback = tryWorkbookPlatformBundledPolicyPacksDemoFallback();

    if (demoFallback !== null) {
      return demoFallback;
    }

    throw new Error("platform-bundled-policy-packs unavailable");
  }
}
