import { stampRouteReferrer } from "@/lib/operator/operator-navigation-referrer";
import { ensureAppInsights } from "@/lib/telemetry";

export type OperatorHomeLifecyclePath = "create-architecture" | "review-architecture" | "explore-completed-review";

/** Records which home lifecycle entry path the user chose. */
export function trackOperatorHomeLifecyclePathClick(path: OperatorHomeLifecyclePath): void {
  stampRouteReferrer("card");

  void ensureAppInsights().then((ai) => {
    if (ai === null) {
      return;
    }

    ai.trackEvent({ name: "OperatorHomeLifecyclePathClick" }, { path });
  });
}
