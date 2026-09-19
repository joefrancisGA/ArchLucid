import type { OperatorScopeRecord } from "@/lib/operator/operator-scope-storage";

export const OPERATOR_DEDICATED_WORKSPACE_STORAGE_KEY = "archlucid_operator_dedicated_workspace_v1" as const;

export function readDedicatedWorkspaceScope(): OperatorScopeRecord | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(OPERATOR_DEDICATED_WORKSPACE_STORAGE_KEY);

    if (raw === null || raw.length === 0) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;

    if (parsed === null || typeof parsed !== "object" || !("tenantId" in parsed)) {
      return null;
    }

    const row = parsed as Record<string, unknown>;
    const tenantId = String(row.tenantId ?? "").trim();
    const workspaceId = String(row.workspaceId ?? "").trim();
    const projectId = String(row.projectId ?? "").trim();

    if (tenantId.length === 0 || workspaceId.length === 0 || projectId.length === 0) {
      return null;
    }

    return {
      tenantId,
      workspaceId,
      projectId,
      workspaceLabel: String(row.workspaceLabel ?? "").trim(),
      projectLabel: String(row.projectLabel ?? "").trim(),
    };
  } catch {
    return null;
  }
}

export function writeDedicatedWorkspaceScope(record: OperatorScopeRecord): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      OPERATOR_DEDICATED_WORKSPACE_STORAGE_KEY,
      JSON.stringify({
        tenantId: record.tenantId,
        workspaceId: record.workspaceId,
        projectId: record.projectId,
        workspaceLabel: record.workspaceLabel,
        projectLabel: record.projectLabel,
      }),
    );
  } catch {
    /* quota / private mode */
  }
}

export function clearDedicatedWorkspaceScope(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(OPERATOR_DEDICATED_WORKSPACE_STORAGE_KEY);
  } catch {
    /* */
  }
}
