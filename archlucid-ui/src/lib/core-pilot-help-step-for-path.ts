import { ARCHITECTURES_LIST_PATH, REVIEWS_LIST_PATH, REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { pathIsWorkingInhabitedFindingsRoute } from "@/lib/inhabit/inhabit-help-route";
import { CORE_PILOT_STEPS, type CorePilotStepBase } from "@/lib/core-pilot-steps";

export type CorePilotHelpStepContext = {
  stepIndex: number;
  step: CorePilotStepBase;
};

/**
 * Map operator routes to the closest Core Pilot checklist step for in-app Help.
 * IR-002: architecture desk and nested findings precede reviews-hub execute/finalize steps.
 */
export function corePilotHelpStepForPath(pathname: string): CorePilotHelpStepContext | null {
  const normalized = (pathname.trim().length === 0 ? "/" : pathname) || "/";

  if (normalized === "/" || normalized === "/architecture/first-review-guide") {
    return { stepIndex: 0, step: CORE_PILOT_STEPS[0] };
  }

  if (normalized === ARCHITECTURES_LIST_PATH || normalized.startsWith(`${ARCHITECTURES_LIST_PATH}/`)) {
    if (pathIsWorkingInhabitedFindingsRoute(normalized)) {
      return { stepIndex: 2, step: CORE_PILOT_STEPS[2] };
    }

    if (normalized.endsWith("/new")) {
      return { stepIndex: 1, step: CORE_PILOT_STEPS[1] };
    }

    return { stepIndex: 0, step: CORE_PILOT_STEPS[0] };
  }

  if (normalized === REVIEWS_NEW_PATH || normalized.startsWith(`${REVIEWS_NEW_PATH}?`)) {
    return { stepIndex: 1, step: CORE_PILOT_STEPS[1] };
  }

  if (normalized === REVIEWS_LIST_PATH) {
    return { stepIndex: 6, step: CORE_PILOT_STEPS[6] };
  }

  if (/^\/architecture\/reviews\/[^/]+$/.test(normalized)) {
    return { stepIndex: 3, step: CORE_PILOT_STEPS[3] };
  }

  return null;
}
