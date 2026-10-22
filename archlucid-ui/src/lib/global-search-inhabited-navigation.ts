import { governanceFindingInspectHref } from "@/components/governance/findings/governance-findings-navigation";
import { resolveWorkingRunReviewLocator } from "@/lib/architecture/resolve-working-run-review-locator";
import { resolveWorkingInhabitedFindingsLandingHref } from "@/lib/resolve-working-inhabited-findings-landing-href";

export type GlobalSearchInhabitedNavigationOptions = {
  readonly isWorkingMode: boolean;
  readonly architectureId?: string | null;
};

/** IP-003 — Working global search run resume lands on inhabited findings when architecture is known. */
export function resolveGlobalSearchRunHref(
  runId: string,
  options: GlobalSearchInhabitedNavigationOptions,
): string {
  return resolveWorkingInhabitedFindingsLandingHref({
    runId,
    architectureId: options.architectureId,
    workingMode: options.isWorkingMode,
  });
}

/** IP-003 — Working global search finding hits use nested focusedFinding when architecture is known. */
export function resolveGlobalSearchFindingHref(
  runId: string,
  findingId: string,
  options: GlobalSearchInhabitedNavigationOptions,
): string {
  const locator = resolveWorkingRunReviewLocator({
    runId,
    architectureId: options.architectureId,
  });

  return governanceFindingInspectHref(runId, findingId, {
    architectureId: locator.architectureId ?? options.architectureId,
    isWorkingMode: options.isWorkingMode,
  });
}
