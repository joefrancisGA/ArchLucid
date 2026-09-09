import { getRouteTitle } from "@/lib/route-titles";
import { GUIDED_OPERATE_SIDEBAR_DEFERRAL_NOTE } from "@/lib/first-week-route-guidance";

export type GuidedPaletteLockedDestination = {
  readonly href: string;
  readonly label: string;
  readonly lockReason: string;
  readonly searchValue: string;
};

/** Guided first-session palette rows that stay hidden from the sidebar until first commit (CD-08). */
const GUIDED_FIRST_SESSION_LOCKED_HREFS: readonly string[] = [
  "/insights/sponsor-report",
  "/governance/audit",
  "/insights/evidence-graph",
  "/insights/compare-two-reviews",
  "/insights/architecture-scorecard",
  "/insights/roi-summary",
];

export function resolveGuidedPaletteLockedDestinations(
  lockReason: string = GUIDED_OPERATE_SIDEBAR_DEFERRAL_NOTE,
): readonly GuidedPaletteLockedDestination[] {
  return GUIDED_FIRST_SESSION_LOCKED_HREFS.map((href) => {
    const label = getRouteTitle(href);

    return {
      href,
      label,
      lockReason,
      searchValue: `${label} ${href} locked unavailable`,
    };
  });
}

export function shouldShowGuidedPaletteLockedDestinations(input: {
  readonly workingMode: boolean;
  readonly hasCommittedArchitectureReview: boolean;
  readonly showFullNav: boolean;
}): boolean {
  if (input.workingMode) {
    return false;
  }

  if (input.hasCommittedArchitectureReview) {
    return false;
  }

  if (input.showFullNav) {
    return false;
  }

  return true;
}
