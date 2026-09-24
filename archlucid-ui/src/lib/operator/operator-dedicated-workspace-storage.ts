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
    const tenantIdValue = row.tenantId;
    const workspaceIdValue = row.workspaceId;
    const projectIdValue = row.projectId;
    const workspaceLabel = row.workspaceLabel;
    const projectLabel = row.projectLabel;

    if (
      typeof tenantIdValue !== "string"
      || typeof workspaceIdValue !== "string"
      || typeof projectIdValue !== "string"
    ) {
      return null;
    }

    const tenantId = tenantIdValue.trim();
    const workspaceId = workspaceIdValue.trim();
    const projectId = projectIdValue.trim();

    if (tenantId.length === 0 || workspaceId.length === 0 || projectId.length === 0) {
      return null;
    }

    return {
      tenantId,
      workspaceId,
      projectId,
      workspaceLabel: typeof workspaceLabel === "string" ? workspaceLabel.trim() : "",
      projectLabel: typeof projectLabel === "string" ? projectLabel.trim() : "",
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
