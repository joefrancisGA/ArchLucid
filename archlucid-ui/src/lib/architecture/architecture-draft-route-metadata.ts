import type { Metadata } from "next";

import {
  architectureDraftDisplayName,
  LEGACY_UNTITLED_ARCHITECTURE_LABEL,
} from "@/lib/architecture/architecture-draft-status";
import { loadArchitectureDraftForRouteCached } from "@/lib/load-architecture-draft-for-route-cached";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { isInvalidDynamicRouteToken } from "@/lib/route-dynamic-param";

/** Document title for `/architectures/[architectureId]` — buyer-facing draft name, not create-bootstrap chrome. */
export async function metadataForArchitectureDraftEditRoute(architectureId: string): Promise<Metadata> {
  const trimmed = architectureId.trim();

  if (trimmed.length === 0 || isInvalidDynamicRouteToken(trimmed)) {
    return { title: LEGACY_UNTITLED_ARCHITECTURE_LABEL };
  }

  try {
    const draft = await loadArchitectureDraftForRouteCached(trimmed);
    const title = architectureDraftDisplayName(draft.document.systemName, draft.document.freeTextIntent);

    if (title === CREATE_ARCHITECTURE_LABEL) {
      return { title: LEGACY_UNTITLED_ARCHITECTURE_LABEL };
    }

    return { title };
  } catch {
    return { title: LEGACY_UNTITLED_ARCHITECTURE_LABEL };
  }
}
