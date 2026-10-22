import { isInfraEvidenceResourceRemovedChange } from "@/lib/infra-evidence/infra-evidence-drift-display";
import type { InfraEvidenceDiffChange } from "@/lib/infra-evidence/infra-evidence-drift-types";

function normalizeArmResourceId(azureResourceId: string | null | undefined): string {
  const trimmed = azureResourceId?.trim().toLowerCase() ?? "";

  if (trimmed.endsWith("/")) {
    return trimmed.slice(0, -1);
  }

  return trimmed;
}

export function isNestedResourceRemovedChange(
  change: InfraEvidenceDiffChange,
  removedResourceIds: readonly string[],
): boolean {
  if (!isInfraEvidenceResourceRemovedChange(change.changeType)) {
    return false;
  }

  const descendantId = normalizeArmResourceId(change.azureResourceId);

  if (descendantId.length === 0) {
    return false;
  }

  return removedResourceIds.some((ancestorId) => {
    const normalizedAncestorId = normalizeArmResourceId(ancestorId);

    if (normalizedAncestorId.length === 0 || normalizedAncestorId === descendantId) {
      return false;
    }

    return descendantId.startsWith(`${normalizedAncestorId}/`);
  });
}

export function suppressNestedResourceRemovedChanges(
  rows: readonly InfraEvidenceDiffChange[],
): InfraEvidenceDiffChange[] {
  const removedResourceIds = rows
    .filter((row) => isInfraEvidenceResourceRemovedChange(row.changeType))
    .map((row) => row.azureResourceId ?? "")
    .filter((azureResourceId) => azureResourceId.trim().length > 0);

  if (removedResourceIds.length === 0) {
    return [...rows];
  }

  return rows.filter((row) => !isNestedResourceRemovedChange(row, removedResourceIds));
}
