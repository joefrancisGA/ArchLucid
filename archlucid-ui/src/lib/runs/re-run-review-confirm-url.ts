export const RE_RUN_REVIEW_CONFIRM_OPEN_PARAM = "reRunConfirmOpen";
export const RE_RUN_REVIEW_CONFIRM_SOURCE_PARAM = "reRunConfirmSource";

export function parseReRunReviewConfirmOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseReRunReviewConfirmSourceFromSearch(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  return trimmed.length === 0 ? null : trimmed;
}

export function resolveReRunReviewConfirmDialogOpenForButton(args: {
  readonly urlConfirmOpen: boolean;
  readonly urlConfirmSource: string | null;
  readonly buttonTestId: string;
}): boolean {
  if (!args.urlConfirmOpen) {
    return false;
  }

  if (args.urlConfirmSource === null) {
    // Legacy URLs without a source opened every mounted button's dialog.
    return false;
  }

  return args.urlConfirmSource === args.buttonTestId;
}

export function reRunReviewConfirmHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
  sourceTestId: string | null = null,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(RE_RUN_REVIEW_CONFIRM_OPEN_PARAM);
    params.delete(RE_RUN_REVIEW_CONFIRM_SOURCE_PARAM);
  } else {
    params.set(RE_RUN_REVIEW_CONFIRM_OPEN_PARAM, "1");

    if (sourceTestId !== null && sourceTestId.length > 0) {
      params.set(RE_RUN_REVIEW_CONFIRM_SOURCE_PARAM, sourceTestId);
    } else {
      params.delete(RE_RUN_REVIEW_CONFIRM_SOURCE_PARAM);
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
