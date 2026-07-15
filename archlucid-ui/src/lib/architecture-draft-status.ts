/** Customer-facing architecture lifecycle — distinct from review or review states. */
export type ArchitectureDraftCustomerStatus = "draft" | "ready-for-review" | "archived";

export const ARCHITECTURE_DRAFT_STATUS_LABELS: Record<ArchitectureDraftCustomerStatus, string> = {
  draft: "Draft",
  "ready-for-review": "Ready for review",
  archived: "Archived",
};

export function architectureDraftDisplayName(systemName: string | undefined, freeTextIntent: string): string {
  const name = systemName?.trim() ?? "";

  if (name.length > 0) {
    return name;
  }

  const intent = freeTextIntent.trim();

  if (intent.length > 0) {
    return intent.length > 64 ? `${intent.slice(0, 61)}…` : intent;
  }

  return "Untitled architecture";
}
