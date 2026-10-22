import type { InfraEvidenceDiffChange } from "@/lib/infra-evidence/infra-evidence-drift-types";

export function formatInfraEvidenceDriftChangedByLabel(change: InfraEvidenceDiffChange): string | null {
  const displayName = change.changedByDisplayName?.trim() ?? "";

  if (displayName.length > 0) {
    return displayName;
  }

  return null;
}
