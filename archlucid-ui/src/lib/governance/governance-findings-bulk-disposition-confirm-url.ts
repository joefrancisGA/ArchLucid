import {
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  GOVERNANCE_FINDINGS_PATH,
} from "@/lib/governance/governance-route-paths";

export const GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_PARAM = "bulkDispConfirm";

export const GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_VALUES = ["accepted", "waived", "deferred"] as const;

export type GovernanceFindingsBulkDispositionConfirmValue =
  (typeof GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_VALUES)[number];

const GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_SET = new Set<string>(GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_VALUES);

export type GovernanceFindingsBulkDisposition =
  | "Accepted"
  | "RejectedAsNotApplicable"
  | "Deferred";

export function governanceFindingsBulkDispositionToUrlValue(
  disposition: GovernanceFindingsBulkDisposition,
): GovernanceFindingsBulkDispositionConfirmValue {
  switch (disposition) {
    case "Accepted":
      return "accepted";
    case "RejectedAsNotApplicable":
      return "waived";
    case "Deferred":
      return "deferred";
    default: {
      const exhaustive: never = disposition;
      return exhaustive;
    }
  }
}

export function governanceFindingsBulkDispositionFromUrlValue(
  value: GovernanceFindingsBulkDispositionConfirmValue,
): GovernanceFindingsBulkDisposition {
  switch (value) {
    case "accepted":
      return "Accepted";
    case "waived":
      return "RejectedAsNotApplicable";
    case "deferred":
      return "Deferred";
    default: {
      const exhaustive: never = value;
      return exhaustive;
    }
  }
}

export function parseGovernanceFindingsBulkDispositionConfirmFromSearch(
  raw: string | null | undefined,
): GovernanceFindingsBulkDispositionConfirmValue | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_SET.has(trimmed)) {
    return null;
  }

  return trimmed as GovernanceFindingsBulkDispositionConfirmValue;
}

export function governanceFindingsBulkDispositionConfirmHrefFromSearch(
  currentSearch: string,
  confirm: GovernanceFindingsBulkDispositionConfirmValue | null,
  pathname: string = GOVERNANCE_FINDINGS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (confirm === null) {
    params.delete(GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_PARAM);
  } else {
    params.set(GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_PARAM, confirm);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function governanceAssignedToMeBulkDispositionConfirmHrefFromSearch(
  currentSearch: string,
  confirm: GovernanceFindingsBulkDispositionConfirmValue | null,
): string {
  return governanceFindingsBulkDispositionConfirmHrefFromSearch(
    currentSearch,
    confirm,
    GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  );
}
