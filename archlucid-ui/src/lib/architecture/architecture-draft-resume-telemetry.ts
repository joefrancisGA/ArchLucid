import { stampRouteReferrer } from "@/lib/operator/operator-navigation-referrer";
import { ensureAppInsights } from "@/lib/telemetry";

export type ArchitectureDraftResumeSource = "reviews-hub" | "architectures-new" | "architectures-list";

/** Records when a user resumes a saved architecture draft from a visible affordance. */
export function trackArchitectureDraftResumeClick(
  source: ArchitectureDraftResumeSource,
  architectureId: string,
): void {
  const trimmedArchitectureId = architectureId.trim();

  if (trimmedArchitectureId.length === 0) {
    return;
  }

  stampRouteReferrer("card");

  void ensureAppInsights().then((ai) => {
    if (ai === null) {
      return;
    }

    ai.trackEvent(
      { name: "ArchitectureDraftResumeClick" },
      { source, architectureId: trimmedArchitectureId },
    );
  });
}
