import { ApiV1Routes } from "@/lib/api-v1-routes";
import type {
  PlatformBundledPolicyPackRegistryEntry,
  PolicyPackAssignment,
  PolicyPackWorkspaceSelectionItem,
} from "@/types/policy-packs";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { policyPackAssignMutationBlockedReason } from "@/lib/policy/policy-pack-assign-mutation-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
}

/** Enables or disables one policy pack assignment for the current workspace. */
export async function setPolicyPackAssignmentEnabled(assignmentId: string, isEnabled: boolean): Promise<void> {
  await apiPutNoContent(
    `/${ApiV1Routes.policyPacks}/assignments/${encodeURIComponent(assignmentId)}/enabled`,
    { isEnabled },
  );
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
