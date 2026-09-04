import { GOVERNANCE_ADVISORY_SCANS_PATH } from "@/lib/governance/governance-route-paths";

export const ADVISORY_SCANS_DISP_REC_ID_PARAM = "dispRecId";
export const ADVISORY_SCANS_DISP_ACTION_PARAM = "dispAction";

export const ADVISORY_SCANS_DISP_ACTIONS = ["accept", "defer", "reject", "implemented"] as const;

export type AdvisoryScansDispositionAction = (typeof ADVISORY_SCANS_DISP_ACTIONS)[number];

const ADVISORY_SCANS_DISP_ACTION_SET = new Set<string>(ADVISORY_SCANS_DISP_ACTIONS);

export type AdvisoryScansDispositionConfirmUrlState = {
  readonly recommendationId: string | null;
  readonly action: AdvisoryScansDispositionAction | null;
};

export function advisoryScansDispositionToUrlAction(action: string): AdvisoryScansDispositionAction | null {
  switch (action) {
    case "Accept":
      return "accept";
    case "Defer":
      return "defer";
    case "Reject":
      return "reject";
    case "MarkImplemented":
      return "implemented";
    default:
      return null;
  }
}

export function advisoryScansUrlActionToDisposition(action: AdvisoryScansDispositionAction): string {
  switch (action) {
    case "accept":
      return "Accept";
    case "defer":
      return "Defer";
    case "reject":
      return "Reject";
    case "implemented":
      return "MarkImplemented";
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}

export function parseAdvisoryScansDispRecIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseAdvisoryScansDispActionFromSearch(
  raw: string | null | undefined,
): AdvisoryScansDispositionAction | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!ADVISORY_SCANS_DISP_ACTION_SET.has(trimmed)) {
    return null;
  }

  return trimmed as AdvisoryScansDispositionAction;
}

export function advisoryScansDispositionConfirmHrefFromSearch(
  currentSearch: string,
  state: AdvisoryScansDispositionConfirmUrlState,
  pathname: string = GOVERNANCE_ADVISORY_SCANS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const recommendationId = (state.recommendationId ?? "").trim();

  if (recommendationId.length === 0 || state.action === null) {
    params.delete(ADVISORY_SCANS_DISP_REC_ID_PARAM);
    params.delete(ADVISORY_SCANS_DISP_ACTION_PARAM);
  } else {
    params.set(ADVISORY_SCANS_DISP_REC_ID_PARAM, recommendationId);
    params.set(ADVISORY_SCANS_DISP_ACTION_PARAM, state.action);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
