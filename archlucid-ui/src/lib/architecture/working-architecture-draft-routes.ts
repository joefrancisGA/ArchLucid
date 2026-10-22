import {
  ARCHITECTURES_LIST_PATH,
  architectureIdentityPath,
  architectureNestedDraftPath,
  parseArchitectureDraftIdFromPath,
} from "@/lib/architecture/architecture-routes";

export type ParsedArchitectureNestedRoute = {
  readonly architectureId: string;
  readonly childKind?: "reviews" | "drafts";
  readonly childId?: string;
};

/** Parses `/architecture/architectures/{id}`, nested jobs, and legacy draft segment paths. */
export function parseArchitectureNestedRoute(pathname: string): ParsedArchitectureNestedRoute | null {
  const path = pathname.split("?")[0] ?? "";
  const prefix = `${ARCHITECTURES_LIST_PATH}/`;

  if (!path.startsWith(prefix)) {
    return null;
  }

  const segments = path
    .slice(prefix.length)
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (segments.length === 0 || segments[0] === "new") {
    return null;
  }

  const architectureId = segments[0] ?? "";

  if (architectureId.length === 0) {
    return null;
  }

  if (segments.length === 1) {
    return { architectureId };
  }

  if (segments.length === 3 && (segments[1] === "reviews" || segments[1] === "drafts")) {
    const childId = segments[2]?.trim() ?? "";

    if (childId.length === 0) {
      return null;
    }

    return {
      architectureId,
      childKind: segments[1],
      childId,
    };
  }

  return { architectureId };
}

/**
 * Redirects legacy Working draft URLs to nested draft paths when the route already carries an identity id.
 * Returns null when the pathname is not a legacy draft segment alias.
 */
export function resolveWorkingPeerDraftRedirectHref(input: {
  readonly architectureId: string;
  readonly draftId: string;
  readonly pathname: string;
}): string | null {
  const architectureId = input.architectureId.trim();
  const draftId = input.draftId.trim();
  const pathname = input.pathname.split("?")[0] ?? "";
  const legacyPath = `${ARCHITECTURES_LIST_PATH}/${encodeURIComponent(draftId)}`;
  const nestedPath = architectureNestedDraftPath(architectureId, draftId);

  if (pathname === legacyPath) {
    return nestedPath;
  }

  const identityDeskPath = architectureIdentityPath(architectureId);

  if (pathname === identityDeskPath) {
    return nestedPath;
  }

  const draftFromPath = parseArchitectureDraftIdFromPath(pathname);

  if (draftFromPath === draftId) {
    return nestedPath;
  }

  return null;
}
