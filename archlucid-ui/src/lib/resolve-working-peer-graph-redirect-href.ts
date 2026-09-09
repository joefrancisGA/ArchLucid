import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import {
  ARCHITECTURES_LIST_PATH,
  architectureNestedGraphPath,
} from "@/lib/architecture/architecture-routes";

export type ResolveWorkingPeerGraphRedirectHrefInput = {
  readonly pathname: string;
  readonly search?: string | null;
  readonly lastOpenArchitectureId?: string | null;
};

/**
 * Working peer Evidence graph → nested graph when architecture is known (ADR 0079 / SY-41).
 * Returns null when no redirect applies (Guided, already nested, or unscoped with no architecture).
 */
export function resolveWorkingPeerGraphRedirectHref(
  input: ResolveWorkingPeerGraphRedirectHrefInput,
): string | null {
  const path = input.pathname.split("?")[0] ?? "";

  if (path !== EVIDENCE_GRAPH_PATH) {
    return null;
  }

  const architectureId = input.lastOpenArchitectureId?.trim() ?? "";

  if (architectureId.length === 0) {
    const search = input.search?.trim() ?? "";

    return search.length > 0
      ? `${ARCHITECTURES_LIST_PATH}${search.startsWith("?") ? search : `?${search}`}`
      : ARCHITECTURES_LIST_PATH;
  }

  const nestedBase = architectureNestedGraphPath(architectureId);
  const search = input.search?.trim() ?? "";

  if (search.length === 0) {
    return nestedBase;
  }

  const normalizedSearch = search.startsWith("?") ? search : `?${search}`;

  return `${nestedBase}${normalizedSearch}`;
}
