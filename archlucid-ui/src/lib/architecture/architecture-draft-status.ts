import { isArchitectureCreationBootstrapIntent } from "@/lib/architecture/architecture-creation-bootstrap";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { parseIsoUtcMs } from "@/lib/format-iso-utc";

/** Customer-facing architecture lifecycle — distinct from review or review states. */
export type ArchitectureDraftCustomerStatus = "draft" | "ready-for-review" | "archived";

/**
 * Derives customer-facing draft lifecycle for list and workspace chrome.
 * Linked review or review-ready fields mean ready-for-review — not bare Draft.
 */
export function resolveArchitectureDraftCustomerStatus(input: {
  readonly linkedReviewId: string | null;
  readonly reviewReadinessValid: boolean;
  readonly registryStatus?: ArchitectureDraftCustomerStatus | null;
}): ArchitectureDraftCustomerStatus {
  if (input.registryStatus === "archived") {
    return "archived";
  }

  if (input.linkedReviewId !== null) {
    return "ready-for-review";
  }

  if (input.reviewReadinessValid) {
    return "ready-for-review";
  }

  return "draft";
}

export const ARCHITECTURE_DRAFT_STATUS_LABELS: Record<ArchitectureDraftCustomerStatus, string> = {
  draft: "Draft",
  "ready-for-review": "Ready for review",
  archived: "Archived",
};

/** Customer-facing placeholder when a draft has no system name. */
export const UNTITLED_ARCHITECTURE_LABEL = "Untitled architecture" as const;

/**
 * Prior untitled labels still present in local registries — sanitized on read.
 * Includes dated "Architecture draft · Created …" titles from an earlier list layout.
 */
export const LEGACY_UNTITLED_ARCHITECTURE_LABEL = "Architecture draft" as const;

/**
 * Maps draft lifecycle to StatusTag kind.
 * Ready-for-review is blue readiness (in-progress), not success-green.
 */
export function architectureDraftCustomerStatusTagKind(
  status: ArchitectureDraftCustomerStatus,
): EnterpriseStatusKind {
  switch (status) {
    case "draft":
      return "draft";

    case "ready-for-review":
      return "in-progress";

    case "archived":
      return "neutral";

    default: {
      const _exhaustive: never = status;

      return _exhaustive;
    }
  }
}

/** Short calendar date for list metadata (e.g. Jul 12, 2026). */
export function formatArchitectureDraftCreatedLabel(
  referenceUtc: string | null | undefined,
): string | null {
  if (referenceUtc === null || referenceUtc === undefined) {
    return null;
  }

  const trimmed = referenceUtc.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const ms = parseIsoUtcMs(trimmed);

  if (Number.isNaN(ms)) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(ms));
}

/**
 * Placeholder title for unnamed drafts.
 * Created/updated dates belong in metadata — not in the title string.
 */
export function architectureDraftPlaceholderTitle(_referenceUtc?: string | null): string {
  void _referenceUtc;

  return UNTITLED_ARCHITECTURE_LABEL;
}

/** Strips a leading markdown ATX heading marker so paste-as-title stays readable. */
export function stripLeadingMarkdownHeading(title: string): string {
  return title.replace(/^#{1,6}\s+/, "").trim();
}

function isUntitledArchitectureTitle(title: string): boolean {
  if (title === UNTITLED_ARCHITECTURE_LABEL || title === LEGACY_UNTITLED_ARCHITECTURE_LABEL) {
    return true;
  }

  if (title.startsWith(`${UNTITLED_ARCHITECTURE_LABEL} · Created `)) {
    return true;
  }

  if (title.startsWith(`${LEGACY_UNTITLED_ARCHITECTURE_LABEL} · Created `)) {
    return true;
  }

  return false;
}

/**
 * Customer-facing draft title from system name / intent.
 * Bootstrap placeholder intent must never appear in UI.
 */
export function architectureDraftDisplayName(systemName: string | undefined, freeTextIntent: string): string {
  const name = stripLeadingMarkdownHeading(systemName?.trim() ?? "");

  if (name.length > 0) {
    return name;
  }

  if (isArchitectureCreationBootstrapIntent(freeTextIntent)) {
    return UNTITLED_ARCHITECTURE_LABEL;
  }

  const intent = stripLeadingMarkdownHeading(freeTextIntent.trim());

  if (intent.length > 0) {
    return intent.length > 64 ? `${intent.slice(0, 61)}…` : intent;
  }

  return UNTITLED_ARCHITECTURE_LABEL;
}

/**
 * Sanitizes a stored registry display name so historical bootstrap markers,
 * markdown headings, and bare untitled labels never reach customer-visible surfaces.
 */
export function customerFacingArchitectureDraftTitle(
  displayName: string | null | undefined,
  referenceUtc?: string | null,
): string {
  if (displayName === null || displayName === undefined) {
    return architectureDraftPlaceholderTitle(referenceUtc);
  }

  const trimmed = stripLeadingMarkdownHeading(displayName.trim());

  if (trimmed.length === 0) {
    return architectureDraftPlaceholderTitle(referenceUtc);
  }

  if (isArchitectureCreationBootstrapIntent(trimmed)) {
    return architectureDraftPlaceholderTitle(referenceUtc);
  }

  if (isUntitledArchitectureTitle(trimmed)) {
    return architectureDraftPlaceholderTitle(referenceUtc);
  }

  return trimmed;
}
