import { architectureDraftPath } from "@/lib/architecture/architecture-routes";
import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";
import { REVIEWS_NEW_GUIDED_INTAKE_HREF } from "@/lib/reviews-new-path-copy";

export const ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_BODY =
  "Trust-boundary, privileged-access, and external-exposure engines did not run because this graph has no Actor nodes. IaC uploads alone do not create actors.";

export const ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_WORKING_RECOVERY =
  "Add people and systems on the Architecture tab for this review.";

export const ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_GUIDED_RECOVERY =
  "Add people and systems on the Architecture tab, or use guided intake when you are starting a new package.";

export const ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_ARCHITECTURE_LINK_LABEL =
  "Add people and systems on Architecture";

export const ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_DRAFT_LINK_LABEL = "Open draft actors";

export const ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_GUIDED_INTAKE_LINK_LABEL =
  "Open guided intake — People, systems, and integrations";

export function buildActorDependentQuietEnginesArchitectureHref(runId: string): string {
  return buildReviewDetailTabHref(runId.trim(), "architecture");
}

export function buildActorDependentQuietEnginesDraftHref(draftArchitectureId: string): string {
  return architectureDraftPath(draftArchitectureId.trim());
}

export const ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_GUIDED_INTAKE_HREF = REVIEWS_NEW_GUIDED_INTAKE_HREF;
