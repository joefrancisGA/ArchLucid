import { ApiV1Routes } from "@/lib/api-v1-routes";
import type {
  PlatformBundledPolicyPackRegistryEntry,
  PolicyPackAssignment,
  PolicyPackWorkspaceSelectionItem,
} from "@/types/policy-packs";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { policyPackAssignMutationBlockedReason } from "@/lib/policy/policy-pack-assign-mutation-blocked-reason";
import { policyPackArchiveMutationBlockedReason } from "@/lib/policy/policy-pack-archive-mutation-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { recordsOnly, trimRequiredPathSegment } from "./api-boundary-normalization";

import { apiGet, apiPostJson, apiPostNoContent, apiPutJson, apiPutNoContent } from "./http";

/** Assigns a specific policy pack version to the current scope (project/workspace/tenant). */
export async function assignPolicyPack(
  policyPackId: string,
  body: { version: string; scopeLevel?: string; isPinned?: boolean; isOrganizationRequired?: boolean },
): Promise<PolicyPackAssignment> {
  const normalizedPolicyPackId = trimRequiredPathSegment(policyPackId, "policyPackId");

  try {
    return await apiPostJson<PolicyPackAssignment>(
      `/${ApiV1Routes.policyPacks}/${encodeURIComponent(normalizedPolicyPackId)}/assign`,
      { ...body, version: body.version.trim(), scopeLevel: body.scopeLevel?.trim() },
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = policyPackAssignMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Lists workspace policy packs with assignment ids for tenant opt-in/opt-out. */
export async function listPolicyPackWorkspaceSelection(): Promise<PolicyPackWorkspaceSelectionItem[]> {
  return recordsOnly<PolicyPackWorkspaceSelectionItem>(
    await apiGet<unknown>(`/${ApiV1Routes.policyPacks}/workspace-selection`),
  );
}

/** Marks one policy pack assignment archived for the current tenant (row retained for audit). */
export async function archivePolicyPackAssignment(assignmentId: string): Promise<void> {
  const normalizedAssignmentId = trimRequiredPathSegment(assignmentId, "assignmentId");

  try {
    await apiPostNoContent(
      `/${ApiV1Routes.policyPacks}/assignments/${encodeURIComponent(normalizedAssignmentId)}/archive`,
      {},
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = policyPackArchiveMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }

}

/** Enables or disables one policy pack assignment for the current workspace. */
export async function setPolicyPackAssignmentEnabled(assignmentId: string, isEnabled: boolean): Promise<void> {
  const normalizedAssignmentId = trimRequiredPathSegment(assignmentId, "assignmentId");

  try {
    await apiPutNoContent(
      `/${ApiV1Routes.policyPacks}/assignments/${encodeURIComponent(normalizedAssignmentId)}/enabled`,
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
  const normalizedAssignmentId = trimRequiredPathSegment(assignmentId, "assignmentId");

  try {
    await apiPutNoContent(
      `/${ApiV1Routes.policyPacks}/assignments/${encodeURIComponent(normalizedAssignmentId)}/organization-required`,
      { isOrganizationRequired },
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = policyPackAssignMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Activates or deactivates a bundled policy pack platform-wide (internal admin). */
export async function setPlatformBundledPolicyPackActivation(
  bundleContentFile: string,
  isGloballyActive: boolean,
): Promise<PlatformBundledPolicyPackRegistryEntry> {
  const normalizedBundleContentFile = trimRequiredPathSegment(bundleContentFile, "bundleContentFile");

  try {
    return await apiPutJson(
      `/v1/admin/platform-bundled-policy-packs/${encodeURIComponent(normalizedBundleContentFile)}/activation`,
      { isGloballyActive },
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = policyPackAssignMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
