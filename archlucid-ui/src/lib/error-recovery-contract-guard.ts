import {
  ERROR_RECOVERY_CONTRACT_GUARDED_SURFACES,
  type ErrorRecoveryContractGuardedSurface,
} from "@/lib/error-recovery-contract-inventory";
import { readSurfaceSourceBundle } from "@/lib/report-problem-surfaces-guard";

export type ErrorRecoveryContractGuardViolation = {
  readonly surfaceId: string;
  readonly message: string;
};

export function findErrorRecoveryContractSurfaceViolations(uiRoot: string): ErrorRecoveryContractGuardViolation[] {
  return findSurfaceMarkerViolations(uiRoot, ERROR_RECOVERY_CONTRACT_GUARDED_SURFACES);
}

/** Same marker check against any inventory using the guarded-surface shape (e.g. section load failures). */
export function findSurfaceMarkerViolations(
  uiRoot: string,
  surfaces: readonly ErrorRecoveryContractGuardedSurface[],
): ErrorRecoveryContractGuardViolation[] {
  return surfaces.flatMap((surface) => findViolationsForSurface(uiRoot, surface));
}

function findViolationsForSurface(
  uiRoot: string,
  surface: ErrorRecoveryContractGuardedSurface,
): ErrorRecoveryContractGuardViolation[] {
  const violations: ErrorRecoveryContractGuardViolation[] = [];
  const combinedSource = surface.sourceRoots.map((root) => readSurfaceSourceBundle(uiRoot, root)).join("\n");

  if (combinedSource.length === 0) {
    violations.push({
      surfaceId: surface.id,
      message: `Guarded source roots missing on disk: ${surface.sourceRoots.join(", ")}`,
    });

    return violations;
  }

  for (const marker of surface.requiredMarkers) {
    if (!combinedSource.includes(marker)) {
      violations.push({
        surfaceId: surface.id,
        message: `Expected recovery contract marker "${marker}" in guarded sources.`,
      });
    }
  }

  return violations;
}
