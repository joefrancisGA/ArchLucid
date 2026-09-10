import type { Metadata } from "next";

import {
  architectureDraftDisplayName,
  LEGACY_UNTITLED_ARCHITECTURE_LABEL,
} from "@/lib/architecture/architecture-draft-status";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { loadArchitectureDraftForRouteCached } from "@/lib/load-architecture-draft-for-route-cached";
import { isInvalidDynamicRouteToken } from "@/lib/route-dynamic-param";

export const WORKING_NESTED_REVIEW_DOCUMENT_TITLE_SUFFIX = " · Review" as const;

/** SY-61 / SY-85 — browser tab titles on Working nested routes use the architecture display name. */
export function formatWorkingArchitectureDocumentTitle(
  displayName: string,
  suffix?: string,
): string {
  if (suffix === undefined || suffix.length === 0) {
    return displayName;
  }

  return `${displayName}${suffix}`;
}

export async function resolveWorkingArchitectureDisplayName(architectureId: string): Promise<string> {
  const trimmed = architectureId.trim();

  if (trimmed.length === 0 || isInvalidDynamicRouteToken(trimmed)) {
    return LEGACY_UNTITLED_ARCHITECTURE_LABEL;
  }

  try {
    const draft = await loadArchitectureDraftForRouteCached(trimmed);
    const title = architectureDraftDisplayName(draft.document.systemName, draft.document.freeTextIntent);

    if (title === CREATE_ARCHITECTURE_LABEL) {
      return LEGACY_UNTITLED_ARCHITECTURE_LABEL;
    }

    return title;
  } catch {
    return LEGACY_UNTITLED_ARCHITECTURE_LABEL;
  }
}

export async function metadataForWorkingArchitectureNestedReviewRoute(
  architectureId: string,
): Promise<Metadata> {
  const displayName = await resolveWorkingArchitectureDisplayName(architectureId);

  return {
    title: formatWorkingArchitectureDocumentTitle(
      displayName,
      WORKING_NESTED_REVIEW_DOCUMENT_TITLE_SUFFIX,
    ),
  };
}

export async function metadataForWorkingArchitectureNestedToolRoute(
  architectureId: string,
  toolLabel: string,
): Promise<Metadata> {
  const displayName = await resolveWorkingArchitectureDisplayName(architectureId);
  const trimmedToolLabel = toolLabel.trim();

  return {
    title: formatWorkingArchitectureDocumentTitle(
      displayName,
      trimmedToolLabel.length > 0 ? ` · ${trimmedToolLabel}` : undefined,
    ),
  };
}
