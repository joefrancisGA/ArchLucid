import { parseArchitectureNestedToolArchitectureId } from "@/lib/architecture/architecture-routes";

/** IH-014 — nested findings routes map to inhabit help, not getting-started. */
export function pathIsWorkingInhabitedFindingsRoute(pathname: string): boolean {
  const architectureId = parseArchitectureNestedToolArchitectureId(pathname, "findings");

  return architectureId !== null && architectureId.trim().length > 0;
}
