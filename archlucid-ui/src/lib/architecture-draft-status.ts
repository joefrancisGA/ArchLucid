import { isArchitectureCreationBootstrapIntent } from "@/lib/architecture-creation-bootstrap";

/** Customer-facing architecture lifecycle — distinct from review or review states. */
export type ArchitectureDraftCustomerStatus = "draft" | "ready-for-review" | "archived";

export const ARCHITECTURE_DRAFT_STATUS_LABELS: Record<ArchitectureDraftCustomerStatus, string> = {
  draft: "Draft",
  "ready-for-review": "Ready for review",
  archived: "Archived",
};

export const UNTITLED_ARCHITECTURE_LABEL = "Untitled architecture" as const;

/**
 * Customer-facing draft title from system name / intent.
 * Bootstrap placeholder intent must never appear in UI.
 */
export function architectureDraftDisplayName(systemName: string | undefined, freeTextIntent: string): string {
  const name = systemName?.trim() ?? "";

  if (name.length > 0) {
    return name;
  }

  if (isArchitectureCreationBootstrapIntent(freeTextIntent)) {
    return UNTITLED_ARCHITECTURE_LABEL;
  }

  const intent = freeTextIntent.trim();

  if (intent.length > 0) {
    return intent.length > 64 ? `${intent.slice(0, 61)}…` : intent;
  }

  return UNTITLED_ARCHITECTURE_LABEL;
}

/**
 * Sanitizes a stored registry display name so historical bootstrap markers
 * never reach customer-visible surfaces.
 */
export function customerFacingArchitectureDraftTitle(displayName: string | null | undefined): string {
  if (displayName === null || displayName === undefined) {
    return UNTITLED_ARCHITECTURE_LABEL;
  }

  const trimmed = displayName.trim();

  if (trimmed.length === 0) {
    return UNTITLED_ARCHITECTURE_LABEL;
  }

  if (isArchitectureCreationBootstrapIntent(trimmed)) {
    return UNTITLED_ARCHITECTURE_LABEL;
  }

  return trimmed;
}
