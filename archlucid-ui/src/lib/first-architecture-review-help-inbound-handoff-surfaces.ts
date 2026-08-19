import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";

/**
 * TB-1376 — product surfaces that link to the first-review help guide must use
 * `/help/first-architecture-review`, not retired slug/path twins.
 */
export const RETIRED_FIRST_REVIEW_HELP_HANDOFF_MARKERS: readonly string[] = [
  "/help/first-hour-operator-path",
  "/help/core-pilot",
  'href="/help/core-pilot"',
  'helpSlug="core-pilot"',
  "first-hour-operator-path",
] as const;

export const FIRST_ARCHITECTURE_REVIEW_INBOUND_HANDOFF_SOURCE_FILES: readonly string[] = [
  "src/lib/getting-started-help-guide-content.ts",
  "src/lib/troubleshooting-help-guide-content.ts",
  "src/lib/help/help-search-panel-catalog.ts",
  "src/lib/first-review-90min-playbook-alignment.ts",
  "src/components/CorePilotNextStepsCard.tsx",
  "src/lib/help/help-center-catalog.ts",
  "src/lib/usability/page-help-topic-map.ts",
  "src/lib/repeat-review-loop-help-guide-content.ts",
  "src/components/CorePilotChecklist.tsx",
  "src/components/CorePilotWizard.tsx",
] as const;

export function sourceContainsRetiredFirstReviewHelpHandoff(source: string): boolean {
  return RETIRED_FIRST_REVIEW_HELP_HANDOFF_MARKERS.some((marker) => source.includes(marker));
}

export function hrefIsCanonicalFirstArchitectureReviewHelp(href: string): boolean {
  return href === FIRST_ARCHITECTURE_REVIEW_HELP_PATH || href.startsWith(`${FIRST_ARCHITECTURE_REVIEW_HELP_PATH}#`);
}
