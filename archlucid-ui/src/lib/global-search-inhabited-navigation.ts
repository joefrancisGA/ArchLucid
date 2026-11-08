import { governanceFindingInspectHref } from "@/components/governance/findings/governance-findings-navigation";
import { resolveWorkingRunReviewLocator } from "@/lib/architecture/resolve-working-run-review-locator";
import { resolveGlobalSearchDeskArchitectureId } from "@/lib/global-search-desk-architecture-id";
import { resolveWorkingInhabitedFindingsLandingHref } from "@/lib/resolve-working-inhabited-findings-landing-href";

export type GlobalSearchInhabitedNavigationOptions = {
  readonly isWorkingMode: boolean;
  readonly architectureId?: string | null;
  readonly pathname?: string | null;
  readonly search?: string | null;
};

/** IP-003 — Working global search run resume lands on inhabited findings when architecture is known. */
export function resolveGlobalSearchRunHref(
  runId: string,
  options: GlobalSearchInhabitedNavigationOptions,
): string {
  const architectureId = resolveGlobalSearchDeskArchitectureId({
    runId,
    architectureId: options.architectureId,
    pathname: options.pathname,
    search: options.search,
  });

  return resolveWorkingInhabitedFindingsLandingHref({
    runId,
    architectureId,
    workingMode: options.isWorkingMode,
  });
}

/** IP-003 — Working global search finding hits use nested focusedFinding when architecture is known. */
export function resolveGlobalSearchFindingHref(
  runId: string,
  findingId: string,
  options: GlobalSearchInhabitedNavigationOptions,
): string {
  const architectureId = resolveGlobalSearchDeskArchitectureId({
    runId,
    architectureId: options.architectureId,
    pathname: options.pathname,
    search: options.search,
  });
  const locator = resolveWorkingRunReviewLocator({
    runId,
    architectureId,
  });

  return governanceFindingInspectHref(runId, findingId, {
    architectureId: locator.architectureId ?? architectureId,
    isWorkingMode: options.isWorkingMode,
  });
}
