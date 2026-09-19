import {
  BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL,
} from "@/lib/buyer/buyer-polish-copy";
import { isDemoSeededOverviewScope } from "@/lib/demo-seeded-overview";
import { readDedicatedWorkspaceScope } from "@/lib/operator/operator-dedicated-workspace-storage";
import { readLastRegistrationPayload } from "@/lib/registration-session";
import type { OperatorScopeRecord } from "@/lib/operator/operator-scope-storage";
import { isEffectiveDevDefaultScope } from "@/lib/scope-switcher-display";
import {
  DEV_SCOPE_PROJECT_ID,
  DEV_SCOPE_TENANT_ID,
  DEV_SCOPE_WORKSPACE_ID,
} from "@/lib/scope";

export function operatorScopeRecordFromProxyHeaders(
  headers: Record<string, string>,
  labels?: { readonly workspaceLabel?: string; readonly projectLabel?: string },
): OperatorScopeRecord {
  return {
    tenantId: headers["x-tenant-id"]?.trim() ?? "",
    workspaceId: headers["x-workspace-id"]?.trim() ?? "",
    projectId: headers["x-project-id"]?.trim() ?? "",
    workspaceLabel: labels?.workspaceLabel?.trim() ?? "",
    projectLabel: labels?.projectLabel?.trim() ?? "",
  };
}

export function isSampleWorkspaceScope(record: Pick<OperatorScopeRecord, "tenantId" | "workspaceId" | "projectId">): boolean {
  return (
    isEffectiveDevDefaultScope(record.workspaceId, record.projectId)
    || isDemoSeededOverviewScope({
      "x-tenant-id": record.tenantId,
      "x-workspace-id": record.workspaceId,
      "x-project-id": record.projectId,
    })
  );
}

/** Canonical Customer Intake Demo scope for explicit sample-workspace visits. */
export function buildCustomerIntakeDemoScopeRecord(): OperatorScopeRecord {
  return {
    tenantId: DEV_SCOPE_TENANT_ID,
    workspaceId: DEV_SCOPE_WORKSPACE_ID,
    projectId: DEV_SCOPE_PROJECT_ID,
    workspaceLabel: BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL,
    projectLabel: "Primary project",
  };
}

export function tryResolveDedicatedScopeFromRegistration(): OperatorScopeRecord | null {
  const payload = readLastRegistrationPayload();

  if (payload === null) {
    return null;
  }

  const tenantId = payload.tenantId?.trim() ?? "";
  const workspaceId = payload.defaultWorkspaceId?.trim() ?? "";
  const projectId = payload.defaultProjectId?.trim() ?? "";
  const organizationName = payload.organizationName?.trim() ?? "";

  if (tenantId.length === 0 || workspaceId.length === 0 || projectId.length === 0) {
    return null;
  }

  const record: OperatorScopeRecord = {
    tenantId,
    workspaceId,
    projectId,
    workspaceLabel: organizationName.length > 0 ? organizationName : "",
    projectLabel: "Primary project",
  };

  if (isSampleWorkspaceScope(record)) {
    return null;
  }

  return record;
}

export function resolveDedicatedWorkspaceCandidate(): OperatorScopeRecord | null {
  const fromRegistration = tryResolveDedicatedScopeFromRegistration();

  if (fromRegistration !== null) {
    return fromRegistration;
  }

  const fromDedicated = readDedicatedWorkspaceScope();

  if (fromDedicated !== null && !isSampleWorkspaceScope(fromDedicated)) {
    return fromDedicated;
  }

  return null;
}
