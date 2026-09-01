import type { CurrentPrincipal } from "@/lib/current-principal";
import { canDeleteOwnedWork } from "@/lib/work-ownership-delete-eligibility";

export function canDeleteArchitectureDraft(input: {
  readonly linkedReviewId: string | null;
  readonly customerStatus?: "draft" | "ready-for-review" | "review-linked" | "archived";
  readonly serverStatus?: string | null;
  readonly createdByUserId?: string | null;
  readonly callerAuthorityRank: number;
  readonly allowCreatorDeleteOwnedWork: boolean;
  readonly callerPrincipal?: Pick<CurrentPrincipal, "name" | "meClaims">;
}): boolean {
  if (input.linkedReviewId !== null) {
    return false;
  }

  if (input.customerStatus === "archived") {
    return false;
  }

  if (input.serverStatus !== undefined && input.serverStatus !== null) {
    if (input.serverStatus !== "Drafting" && input.serverStatus !== "Admitted") {
      return false;
    }
  }

  return canDeleteOwnedWork({
    createdByUserId: input.createdByUserId,
    callerAuthorityRank: input.callerAuthorityRank,
    allowCreatorDeleteOwnedWork: input.allowCreatorDeleteOwnedWork,
    callerPrincipal: input.callerPrincipal,
  });
}
