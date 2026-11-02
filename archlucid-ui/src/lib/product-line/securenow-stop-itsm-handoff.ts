import {
  ITSM_ONBOARDING_WIZARD_PATH,
  ITSM_ONBOARDING_WIZARD_STEP_PARAM,
} from "@/lib/itsm/itsm-onboarding-wizard-step-url";

export const SECURENOW_PILOT_STOP_ITSM_DRAFT_PATH_ID_PARAM = "pilotStopPathId" as const;
export const SECURENOW_PILOT_STOP_ITSM_DRAFT_RATIONALE_PARAM = "pilotStopRationale" as const;

export const SECURENOW_PILOT_STOP_ITSM_DRAFT_DISCIPLINE =
  "Draft only. Submit outbound work from the ITSM smoke runbooks step when you are ready." as const;

export function buildSecureNowStopItsmOutboundHandoffHref(pathId: string, rationale: string): string {
  const params = new URLSearchParams();
  params.set(ITSM_ONBOARDING_WIZARD_STEP_PARAM, "runbooks");
  params.set(SECURENOW_PILOT_STOP_ITSM_DRAFT_PATH_ID_PARAM, pathId.trim());
  params.set(SECURENOW_PILOT_STOP_ITSM_DRAFT_RATIONALE_PARAM, rationale.trim());
  return `${ITSM_ONBOARDING_WIZARD_PATH}?${params.toString()}`;
}

export function parseSecureNowStopItsmOutboundDraftFromSearch(
  searchParams: Pick<URLSearchParams, "get">,
): { readonly pathId: string; readonly rationale: string } | null {
  const pathId = searchParams.get(SECURENOW_PILOT_STOP_ITSM_DRAFT_PATH_ID_PARAM)?.trim() ?? "";
  const rationale = searchParams.get(SECURENOW_PILOT_STOP_ITSM_DRAFT_RATIONALE_PARAM)?.trim() ?? "";

  if (pathId.length === 0 || rationale.length === 0) {
    return null;
  }

  return { pathId, rationale };
}
