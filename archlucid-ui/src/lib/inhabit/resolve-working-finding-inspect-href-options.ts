import type { GovernanceFindingInspectHrefOptions } from "@/components/governance/findings/governance-findings-navigation";
import { parseArchitectureNestedDeskArchitectureId } from "@/lib/architecture/architecture-routes";
import { parseArchitectureNestedRoute } from "@/lib/architecture/working-architecture-draft-routes";

export type ResolveWorkingFindingInspectHrefOptionsInput = {
  readonly workingMode: boolean;
  readonly pathname: string | null;
  readonly scopedArchitectureId?: string | null;
};

function resolveWorkingArchitectureId(
  pathname: string | null,
  scopedArchitectureId?: string | null,
): string | null {
  const scoped = scopedArchitectureId?.trim() ?? "";

  if (scoped.length > 0) {
    return scoped;
  }

  const deskArchitectureId = parseArchitectureNestedDeskArchitectureId(pathname ?? "");

  if (deskArchitectureId !== null && deskArchitectureId.trim().length > 0) {
    return deskArchitectureId.trim();
  }

  const nestedArchitectureId = parseArchitectureNestedRoute(pathname ?? "")?.architectureId?.trim() ?? "";

  return nestedArchitectureId.length > 0 ? nestedArchitectureId : null;
}

/** WA-002 — Working specialist surfaces stay on nested focusedFinding when architecture is known. */
export function resolveWorkingFindingInspectHrefOptions(
  input: ResolveWorkingFindingInspectHrefOptionsInput,
): GovernanceFindingInspectHrefOptions | undefined {
  if (!input.workingMode) {
    return undefined;
  }

  const architectureId = resolveWorkingArchitectureId(input.pathname, input.scopedArchitectureId);

  if (architectureId === null) {
    return undefined;
  }

  return {
    architectureId,
    isWorkingMode: true,
  };
}
