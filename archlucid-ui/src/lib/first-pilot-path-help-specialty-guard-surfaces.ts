/**
 * TB-1379 — `/help/first-pilot-path` retired; complete review workflow depth ships on the
 * canonical first-architecture-review specialty companion (not generic markdown chrome).
 */
export const FIRST_PILOT_PATH_HELP_SPECIALTY_SOURCE_FILES: readonly string[] = [
  "src/app/(operator)/help/_sections/HelpCorePilotGuideView.tsx",
  "src/app/(operator)/help/[...topic]/page.tsx",
] as const;

export const FIRST_PILOT_PATH_RETIRED_ALIAS_SLUG = "first-pilot-path";

export const FIRST_ARCHITECTURE_REVIEW_SPECIALTY_ROOT_TEST_ID = "help-core-pilot-guide";

export const FIRST_ARCHITECTURE_REVIEW_PRIMARY_START_CTA_TEST_ID = "core-pilot-primary-start-cta";

export const FIRST_ARCHITECTURE_REVIEW_PRIMARY_START_HREF = "/architecture/reviews/new";

export const FIRST_PILOT_PATH_HELP_SPECIALTY_MARKERS: readonly string[] = [
  FIRST_ARCHITECTURE_REVIEW_SPECIALTY_ROOT_TEST_ID,
  FIRST_ARCHITECTURE_REVIEW_PRIMARY_START_CTA_TEST_ID,
  "first-architecture-review",
] as const;

export const HELP_TOPIC_PAGE_SPECIALTY_DISPATCH_MARKERS: readonly string[] = [
  "HelpCorePilotGuideView",
  "first-architecture-review",
] as const;

export function sourceDeclaresHelpCorePilotSpecialtyCompanion(source: string): boolean {
  return FIRST_PILOT_PATH_HELP_SPECIALTY_MARKERS.every((marker) => source.includes(marker));
}

export function sourceDispatchesFirstArchitectureReviewSpecialtyCompanion(source: string): boolean {
  return HELP_TOPIC_PAGE_SPECIALTY_DISPATCH_MARKERS.every((marker) => source.includes(marker));
}
