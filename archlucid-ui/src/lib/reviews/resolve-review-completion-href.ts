import { extractArchitectureIdentityIdFromPathname } from "@/lib/desk-continuity-preference";
import { resolveWorkingInhabitedFindingsLandingHref } from "@/lib/resolve-working-inhabited-findings-landing-href";

export type ResolveReviewCompletionHrefInput = {
  readonly runId: string;
  readonly pathname: string;
  readonly architectureId?: string | null;
  readonly requestId?: string | null;
  readonly isWorkingMode?: boolean;
};

/** IP-006 — completion toast deep-links to inhabited findings when architecture is known. */
export function resolveReviewCompletionHref(input: ResolveReviewCompletionHrefInput): string {
  const architectureIdFromPath = extractArchitectureIdentityIdFromPathname(input.pathname, "");

  return resolveWorkingInhabitedFindingsLandingHref({
    runId: input.runId,
    architectureId: input.architectureId ?? architectureIdFromPath,
    requestId: input.requestId,
    workingMode: input.isWorkingMode === true,
  });
}
