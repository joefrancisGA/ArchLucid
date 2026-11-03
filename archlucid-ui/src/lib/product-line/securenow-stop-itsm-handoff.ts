import {
  ITSM_ONBOARDING_WIZARD_PATH,
  ITSM_ONBOARDING_WIZARD_STEP_PARAM,
} from "@/lib/itsm/itsm-onboarding-wizard-step-url";
import {
  ITSM_OUTBOUND_CREATE_FINDING_ID_PARAM,
  ITSM_OUTBOUND_CREATE_OPEN_PARAM,
} from "@/lib/itsm/itsm-outbound-create-issue-panels-url";
import { buildRemediationWorkbenchHref } from "@/lib/infra-evidence/infra-evidence-workbench-url";

export const SECURENOW_PILOT_STOP_ITSM_DRAFT_PATH_ID_PARAM = "pilotStopPathId" as const;
export const SECURENOW_PILOT_STOP_ITSM_DRAFT_RATIONALE_PARAM = "pilotStopRationale" as const;

export const SECURENOW_PILOT_STOP_ITSM_DRAFT_DISCIPLINE =
  "Draft only. Submit outbound work from the ITSM smoke runbooks step when you are ready." as const;

export const SECURENOW_PILOT_STOP_ITSM_FINDING_EXPORT_DRAFT_DISCIPLINE =
  "Draft only. Open the create dialog when you are ready — nothing is sent until you confirm." as const;

export function formatSecureNowPilotStopItsmDraftBody(pathId: string, rationale: string): string {
  return `SecureNow pilot Stop disposition\nPath: ${pathId.trim()}\nRationale: ${rationale.trim()}`;
}

export function buildSecureNowStopItsmFindingExportHandoffHref(input: {
  readonly findingId: string;
  readonly pathId: string;
  readonly rationale: string;
  readonly snapshotId?: string | null;
}): string {
  const findingId = input.findingId.trim();
  const baseHref = buildRemediationWorkbenchHref({
    findingId,
    snapshotId: input.snapshotId ?? undefined,
  });
  const params = new URLSearchParams();
  params.set(ITSM_OUTBOUND_CREATE_OPEN_PARAM, "1");
  params.set(ITSM_OUTBOUND_CREATE_FINDING_ID_PARAM, findingId);
  params.set(SECURENOW_PILOT_STOP_ITSM_DRAFT_PATH_ID_PARAM, input.pathId.trim());
  params.set(SECURENOW_PILOT_STOP_ITSM_DRAFT_RATIONALE_PARAM, input.rationale.trim());
  const separator = baseHref.includes("?") ? "&" : "?";

  return `${baseHref}${separator}${params.toString()}`;
}

export function resolveSecureNowStopItsmOutboundHandoffHref(input: {
  readonly pathId: string;
  readonly rationale: string;
  readonly findingId?: string | null;
  readonly snapshotId?: string | null;
}): string {
  const findingId = input.findingId?.trim() ?? "";

  if (findingId.length > 0) {
    return buildSecureNowStopItsmFindingExportHandoffHref({
      findingId,
      pathId: input.pathId,
      rationale: input.rationale,
      snapshotId: input.snapshotId,
    });
  }

  return buildSecureNowStopItsmOutboundHandoffHref(input.pathId, input.rationale);
}

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
