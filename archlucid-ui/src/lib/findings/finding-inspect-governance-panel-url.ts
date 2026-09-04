export const FINDING_INSPECT_GOV_PANEL_PARAM = "govPanel";
export const FINDING_INSPECT_WAIVER_CONFIRM_PARAM = "waiverConfirm";
export const FINDING_INSPECT_WAIVER_REVOKE_CONFIRM_PARAM = "waiverRevokeConfirm";

export const FINDING_INSPECT_GOV_PANEL_IDS = ["disposition", "waiver", "remediation"] as const;

export type FindingInspectGovernancePanelId = (typeof FINDING_INSPECT_GOV_PANEL_IDS)[number];

const FINDING_INSPECT_GOV_PANEL_ID_SET = new Set<string>(FINDING_INSPECT_GOV_PANEL_IDS);

export type FindingInspectGovernancePanelUrlState = {
  readonly panel: FindingInspectGovernancePanelId | null;
  readonly waiverConfirmOpen: boolean;
  readonly waiverRevokeConfirmOpen: boolean;
};

export function parseFindingInspectGovernancePanelFromSearch(
  raw: string | null | undefined,
): FindingInspectGovernancePanelId | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!FINDING_INSPECT_GOV_PANEL_ID_SET.has(trimmed)) {
    return null;
  }

  return trimmed as FindingInspectGovernancePanelId;
}

export function parseFindingInspectWaiverConfirmOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseFindingInspectWaiverRevokeConfirmOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function findingInspectGovernancePanelHrefFromSearch(
  currentSearch: string,
  state: FindingInspectGovernancePanelUrlState,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (state.panel === null) {
    params.delete(FINDING_INSPECT_GOV_PANEL_PARAM);
  } else {
    params.set(FINDING_INSPECT_GOV_PANEL_PARAM, state.panel);
  }

  if (!state.waiverConfirmOpen) {
    params.delete(FINDING_INSPECT_WAIVER_CONFIRM_PARAM);
  } else {
    params.set(FINDING_INSPECT_WAIVER_CONFIRM_PARAM, "1");
  }

  if (!state.waiverRevokeConfirmOpen) {
    params.delete(FINDING_INSPECT_WAIVER_REVOKE_CONFIRM_PARAM);
  } else {
    params.set(FINDING_INSPECT_WAIVER_REVOKE_CONFIRM_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
