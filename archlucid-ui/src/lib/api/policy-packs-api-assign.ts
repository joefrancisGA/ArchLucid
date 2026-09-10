import { ApiV1Routes } from "@/lib/api-v1-routes";
import type {
  PlatformBundledPolicyPackRegistryEntry,
  PolicyPackAssignment,
  PolicyPackWorkspaceSelectionItem,
} from "@/types/policy-packs";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { policyPackAssignMutationBlockedReason } from "@/lib/policy/policy-pack-assign-mutation-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { apiGet, apiPostJson, apiPostNoContent, apiPutJson, apiPutNoContent } from "./http";

/** Assigns a specific policy pack version to the current scope (project/workspace/tenant). */
export async function assignPolicyPack(
  policyPackId: string,
  body: { version: string; scopeLevel?: string; isPinned?: boolean; isOrganizationRequired?: boolean },
): Promise<PolicyPackAssignment> {
  try {
    return await apiPostJson<PolicyPackAssignment>(
      `/${ApiV1Routes.policyPacks}/${encodeURIComponent(policyPackId)}/assign`,
      body,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = policyPackAssignMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Lists workspace policy packs with assignment ids for tenant opt-in/opt-out. */
export async function listPolicyPackWorkspaceSelection(): Promise<PolicyPackWorkspaceSelectionItem[]> {
  return apiGet(`/${ApiV1Routes.policyPacks}/workspace-selection`);
}

/** Marks one policy pack assignment archived for the current tenant (row retained for audit). */
export async function archivePolicyPackAssignment(assignmentId: string): Promise<void> {
  try {
    await apiPostNoContent(
      `/${ApiV1Routes.policyPacks}/assignments/${encodeURIComponent(assignmentId)}/archive`,
      {},
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = policyPackAssignMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Enables or disables one policy pack assignment for the current workspace. */
export async function setPolicyPackAssignmentEnabled(assignmentId: string, isEnabled: boolean): Promise<void> {
  try {
    await apiPutNoContent(
      `/${ApiV1Routes.policyPacks}/assignments/${encodeURIComponent(assignmentId)}/enabled`,
      { isEnabled },
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = policyPackAssignMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Marks or clears organization-required lock on one policy pack assignment. */
export async function setPolicyPackAssignmentOrganizationRequired(
  assignmentId: string,
  isOrganizationRequired: boolean,
): Promise<void> {
  await apiPutNoContent(
    `/${ApiV1Routes.policyPacks}/assignments/${encodeURIComponent(assignmentId)}/organization-required`,
    { isOrganizationRequired },
  );
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
