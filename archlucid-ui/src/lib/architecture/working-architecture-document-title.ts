import "server-only";

import type { Metadata } from "next";

import {
  architectureDraftDisplayName,
  LEGACY_UNTITLED_ARCHITECTURE_LABEL,
} from "@/lib/architecture/architecture-draft-status";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import {
  formatWorkingArchitectureDocumentTitle,
  WORKING_NESTED_REVIEW_DOCUMENT_TITLE_SUFFIX,
} from "@/lib/architecture/working-architecture-document-title-format";
import { loadArchitectureDraftForRouteCached } from "@/lib/load-architecture-draft-for-route-cached";
import { isInvalidDynamicRouteToken } from "@/lib/route-dynamic-param";

export {
  formatWorkingArchitectureDocumentTitle,
  WORKING_NESTED_REVIEW_DOCUMENT_TITLE_SUFFIX,
} from "@/lib/architecture/working-architecture-document-title-format";

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
