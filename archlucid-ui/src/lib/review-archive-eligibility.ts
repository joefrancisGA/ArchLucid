import type { RunSummary } from "@/types/authority";
import type { CurrentPrincipal } from "@/lib/current-principal";
import { canDeleteOwnedWork } from "@/lib/work-ownership-delete-eligibility";

/** Reviews without a sealed golden manifest may be soft-archived by creators or administrators. */
export function canArchiveReview(
  run: Pick<RunSummary, "hasGoldenManifest" | "isArchived" | "createdByUserId">,
  ownership: {
    readonly callerAuthorityRank: number;
    readonly allowCreatorDeleteOwnedWork: boolean;
    readonly callerPrincipal?: Pick<CurrentPrincipal, "name" | "meClaims">;
  },
): boolean {
  if (run.isArchived === true) {
    return false;
  }

  if (run.hasGoldenManifest === true) {
    return false;
  }

  return canDeleteOwnedWork({
    createdByUserId: run.createdByUserId,
    callerAuthorityRank: ownership.callerAuthorityRank,
    allowCreatorDeleteOwnedWork: ownership.allowCreatorDeleteOwnedWork,
    callerPrincipal: ownership.callerPrincipal,
  });
}
