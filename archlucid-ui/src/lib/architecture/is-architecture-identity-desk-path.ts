import {
  ARCHITECTURE_NEW_DRAFT_SEGMENT,
  ARCHITECTURES_LIST_PATH,
} from "@/lib/architecture/architecture-routes";

/** True for `/architecture/architectures/{architectureId}` identity desks only (AO-43). */
export function isArchitectureIdentityDeskPath(pathname: string): boolean {
  const path = (pathname ?? "").split("?")[0]?.split("#")[0] ?? "";
  const prefix = `${ARCHITECTURES_LIST_PATH}/`;

  if (!path.startsWith(prefix)) {
    return false;
  }

  const segments = path
    .slice(prefix.length)
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (segments.length !== 1) {
    return false;
  }

  return segments[0] !== ARCHITECTURE_NEW_DRAFT_SEGMENT;
}
