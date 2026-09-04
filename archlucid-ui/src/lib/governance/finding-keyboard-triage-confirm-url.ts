export const FINDING_KEYBOARD_TRIAGE_FINDING_ID_PARAM = "kbDispFindingId";
export const FINDING_KEYBOARD_TRIAGE_ACTION_PARAM = "kbDispAction";

export const FINDING_KEYBOARD_TRIAGE_ACTIONS = ["accepted", "remediated", "rejected"] as const;

export type FindingKeyboardTriageAction = (typeof FINDING_KEYBOARD_TRIAGE_ACTIONS)[number];

const FINDING_KEYBOARD_TRIAGE_ACTION_SET = new Set<string>(FINDING_KEYBOARD_TRIAGE_ACTIONS);

export type FindingKeyboardTriageConfirmUrlState = {
  readonly findingId: string | null;
  readonly action: FindingKeyboardTriageAction | null;
};

export function findingKeyboardTriageDispositionToUrlAction(
  disposition: "Accepted" | "Remediated" | "RejectedAsNotApplicable",
): FindingKeyboardTriageAction {
  switch (disposition) {
    case "Accepted":
      return "accepted";
    case "Remediated":
      return "remediated";
    case "RejectedAsNotApplicable":
      return "rejected";
    default: {
      const exhaustive: never = disposition;
      return exhaustive;
    }
  }
}

export function findingKeyboardTriageUrlActionToDisposition(
  action: FindingKeyboardTriageAction,
): "Accepted" | "Remediated" | "RejectedAsNotApplicable" {
  switch (action) {
    case "accepted":
      return "Accepted";
    case "remediated":
      return "Remediated";
    case "rejected":
      return "RejectedAsNotApplicable";
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}

export function parseFindingKeyboardTriageFindingIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseFindingKeyboardTriageActionFromSearch(
  raw: string | null | undefined,
): FindingKeyboardTriageAction | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!FINDING_KEYBOARD_TRIAGE_ACTION_SET.has(trimmed)) {
    return null;
  }

  return trimmed as FindingKeyboardTriageAction;
}

export function findingKeyboardTriageConfirmHrefFromSearch(
  currentSearch: string,
  state: FindingKeyboardTriageConfirmUrlState,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const findingId = (state.findingId ?? "").trim();

  if (findingId.length === 0 || state.action === null) {
    params.delete(FINDING_KEYBOARD_TRIAGE_FINDING_ID_PARAM);
    params.delete(FINDING_KEYBOARD_TRIAGE_ACTION_PARAM);
  } else {
    params.set(FINDING_KEYBOARD_TRIAGE_FINDING_ID_PARAM, findingId);
    params.set(FINDING_KEYBOARD_TRIAGE_ACTION_PARAM, state.action);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
