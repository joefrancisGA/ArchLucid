import type { ArchitecturePackageOriginToken } from "@/lib/architecture/architecture-package-origin";
import { resolveRunSummaryPackageOrigin } from "@/lib/architecture/architecture-package-origin";
import type { RunSummary } from "@/types/authority";

/** SN-004: Architecture tab copy when Created-origin review is the frozen snapshot writer. */
export const ARCHITECTURE_TAB_SPAWN_ONE_WRITER_SNAPSHOT_HELPER =
  "Review snapshot — source material is frozen while this review is open. Clone a new draft from the architecture desk to change it.";

export function guidedIntakeRerunHref(runId: string): string {
  return `/architecture/reviews/new?path=guided-intake&rerun=${encodeURIComponent(runId)}`;
}

export function resolveArchitectureTabEditSourceHref(input: {
  readonly runId: string;
  readonly hasManifest: boolean;
  readonly packageOrigin: ArchitecturePackageOriginToken | null;
}): string | null {
  if (input.hasManifest) {
    return null;
  }

  // Created-origin in-flight reviews: draft spawn path locks the drafting writer (SN-004).
  if (input.packageOrigin === "created") {
    return null;
  }

  return guidedIntakeRerunHref(input.runId);
}

export function resolveArchitectureTabEditSourceHrefFromRunSummary(
  run: RunSummary,
  hasManifest: boolean,
): string | null {
  return resolveArchitectureTabEditSourceHref({
    runId: run.runId,
    hasManifest,
    packageOrigin: resolveRunSummaryPackageOrigin(run),
  });
}

export function resolveArchitectureTabCanEditSource(architectureEditHref: string | null): boolean {
  return architectureEditHref !== null;
}

export function resolveArchitectureTabSubmittedHelperText(input: {
  readonly packageOrigin: ArchitecturePackageOriginToken | null;
  readonly hasManifest: boolean;
  readonly defaultHelper: string;
}): string {
  if (!input.hasManifest && input.packageOrigin === "created") {
    return ARCHITECTURE_TAB_SPAWN_ONE_WRITER_SNAPSHOT_HELPER;
  }

  return input.defaultHelper;
}
