import {
  formatRunListTitleWithDisambiguator,
  type RunListTitleDisambiguatorOptions,
} from "@/lib/operator/run-home-list-disambiguator";
import type { RunSummary } from "@/types/authority";

/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_RUN_ID_NOT_IN_WORKING_PRIMARY_CHROME_DOC_ANCHOR =
  "docs/architecture/adrs/0074-customer-visible-architecture-identity.md" as const;

export const SYSTEM_NOT_JOB_RUN_ID_NOT_IN_WORKING_PRIMARY_CHROME_OWNER = "SN-021" as const;

/** Working hub/desk list rows that must not suffix primary titles with run id fragments. */
export const SYSTEM_NOT_JOB_WORKING_PRIMARY_LIST_TITLE_SURFACES: readonly string[] = [
  "archlucid-ui/src/app/(operator)/architecture/reviews/_sections/reviews-hub-package-display.ts",
  "archlucid-ui/src/components/operator-home/OperatorHomeReviewSummaryCard.tsx",
  "archlucid-ui/src/lib/operator/run-home-list-disambiguator.ts",
];

const WORKING_PRIMARY_LIST_TITLE_OPTIONS: RunListTitleDisambiguatorOptions = {
  workingMode: true,
};

/**
 * SN-021 / ADR 0074 — Working primary list titles identify the system by name.
 * Run/review ids stay in disclosures and support bundles, not primary chrome suffixes.
 */
export function resolveSystemNotJobWorkingPrimaryListTitle(
  run: RunSummary,
  siblingRuns: readonly RunSummary[],
): string {
  return formatRunListTitleWithDisambiguator(run, siblingRuns, WORKING_PRIMARY_LIST_TITLE_OPTIONS);
}
