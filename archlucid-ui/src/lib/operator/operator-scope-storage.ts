import {
  clearOperatorScopeCookie,
  writeOperatorScopeCookieFromHeaders,
} from "@/lib/operator/operator-scope-cookie";
import { clearOperatorShellStatusScopeAgnosticCaches } from "@/lib/operator/operator-shell-status-scope-cache";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { isLikelySignedIn } from "@/lib/oidc/session";
import { registrationScopeHeaders } from "@/lib/registration-session";
import { DEV_SCOPE_PROJECT_ID, DEV_SCOPE_TENANT_ID, DEV_SCOPE_WORKSPACE_ID, getScopeHeaders } from "@/lib/scope";

const STORAGE_KEY = "archlucid_operator_scope_v1";

/** Fired when {@link writeOperatorScopeToStorage} or {@link clearOperatorScopeStorage} mutates scope. */
export const ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT = "archlucid:operator-scope-changed";

/**
 * Browser-persisted scope selection (IDs + optional display labels for the header switcher).
 * The proxy forwards `x-tenant-id` / `x-workspace-id` / `x-project-id` on every `/api/proxy` request;
 * this module is the client-side source of truth when all three IDs are set.
 */
export type OperatorScopeRecord = {
  tenantId: string;
  workspaceId: string;
  projectId: string;
  /** For header copy; may be empty when only IDs are known. */
  workspaceLabel: string;
  projectLabel: string;
};

function isNonEmptyId(value: string | undefined | null): boolean {
  return value !== null && value !== undefined && value.trim().length > 0;
}

export function readOperatorScopeFromStorage(): OperatorScopeRecord | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null || raw.length === 0) {
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || typeof parsed !== "object" || !("tenantId" in parsed)) {
      return null;
    }
    const row = parsed as Record<string, unknown>;
    const tenantId = String(row.tenantId ?? "");
    const workspaceId = String(row.workspaceId ?? "");
    const projectId = String(row.projectId ?? "");
    if (!isNonEmptyId(tenantId) || !isNonEmptyId(workspaceId) || !isNonEmptyId(projectId)) {
      return null;
    }
    return {
      tenantId: tenantId.trim(),
      workspaceId: workspaceId.trim(),
      projectId: projectId.trim(),
      workspaceLabel: String(row.workspaceLabel ?? "").trim(),
      projectLabel: String(row.projectLabel ?? "").trim(),
    };
  } catch {
    return null;
  }
}

function notifyOperatorScopeChanged(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT));
  clearOperatorShellStatusScopeAgnosticCaches(getOperatorQueryClient());
}

export function writeOperatorScopeToStorage(record: OperatorScopeRecord): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        tenantId: record.tenantId,
        workspaceId: record.workspaceId,
        projectId: record.projectId,
        workspaceLabel: record.workspaceLabel,
        projectLabel: record.projectLabel,
      }),
    );
    writeOperatorScopeCookieFromHeaders({
      "x-tenant-id": record.tenantId,
      "x-workspace-id": record.workspaceId,
      "x-project-id": record.projectId,
    });
    notifyOperatorScopeChanged();
  } catch {
    /* quota / private mode */
  }
}

export function clearOperatorScopeStorage(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    clearOperatorScopeCookie();
    notifyOperatorScopeChanged();
  } catch {
    /* */
  }
}

/**
 * Resolves the scope headers the browser should send to `/api/proxy`, matching
 * `buildUpstreamHeaders` in `app/api/proxy/[...path]/route.ts` (server fallback when a header is absent).
 * Priority: explicit operator selection (localStorage) → post-registration session (unsigned only) → dev defaults.
 */
export function getEffectiveBrowserProxyScopeHeaders(): Record<string, string> {
  if (typeof window === "undefined") {
    return getScopeHeaders();
  }

  const fromOperator = readOperatorScopeFromStorage();
  if (fromOperator !== null) {
    const headers = {
      "x-tenant-id": fromOperator.tenantId,
      "x-workspace-id": fromOperator.workspaceId,
      "x-project-id": fromOperator.projectId,
    };
    writeOperatorScopeCookieFromHeaders(headers);

    return headers;
  }

  if (!isLikelySignedIn()) {
    const reg = registrationScopeHeaders();

    if (reg !== null) {
      writeOperatorScopeCookieFromHeaders(reg);

      return reg;
    }
  }

  const devDefaults = getScopeHeaders();
  writeOperatorScopeCookieFromHeaders(devDefaults);

  return devDefaults;
}

/** Display strings for the header when labels are missing. Dev-default UUIDs use neutral copy (no "development" leak in screenshots). */
export function defaultLabelsForScopeIds(
  workspaceId: string,
  projectId: string,
): { workspace: string; project: string } {
  const ws =
    workspaceId.trim() === DEV_SCOPE_WORKSPACE_ID
      ? "Claims Intake Workspace"
      : workspaceId.slice(0, 8) + "…";
  const pr =
    projectId.trim() === DEV_SCOPE_PROJECT_ID ? "Primary project" : projectId.slice(0, 8) + "…";
  return { workspace: ws, project: pr };
}

export function isDevDefaultScopeRecord(record: Pick<OperatorScopeRecord, "tenantId" | "workspaceId" | "projectId">): boolean {
  return (
    record.tenantId === DEV_SCOPE_TENANT_ID &&
    record.workspaceId === DEV_SCOPE_WORKSPACE_ID &&
    record.projectId === DEV_SCOPE_PROJECT_ID
  );
}
