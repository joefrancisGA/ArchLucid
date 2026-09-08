import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import {
  ARCHITECTURES_LIST_PATH,
  architectureNestedAskPath,
} from "@/lib/architecture/architecture-routes";

export type ResolveWorkingPeerAskRedirectHrefInput = {
  readonly pathname: string;
  readonly search?: string | null;
  readonly lastOpenArchitectureId?: string | null;
  readonly queryArchitectureId?: string | null;
};

/**
 * Working peer Ask → nested Ask when architecture is known (ADR 0079 / SY-37).
 * Returns null when no redirect applies (Guided, already nested, or unscoped with no architecture).
 */
export function resolveWorkingPeerAskRedirectHref(
  input: ResolveWorkingPeerAskRedirectHrefInput,
): string | null {
  const path = input.pathname.split("?")[0] ?? "";

  if (path !== ASK_REVIEW_QUESTIONS_PATH) {
    return null;
  }

  const architectureId =
    input.queryArchitectureId?.trim() ||
    input.lastOpenArchitectureId?.trim() ||
    "";

  if (architectureId.length === 0) {
    const search = input.search?.trim() ?? "";

    return search.length > 0 ? `${ARCHITECTURES_LIST_PATH}${search.startsWith("?") ? search : `?${search}`}` : ARCHITECTURES_LIST_PATH;
  }

  const nestedBase = architectureNestedAskPath(architectureId);
  const search = input.search?.trim() ?? "";

  if (search.length === 0) {
    return nestedBase;
  }

  const normalizedSearch = search.startsWith("?") ? search : `?${search}`;

  return `${nestedBase}${normalizedSearch}`;
}
