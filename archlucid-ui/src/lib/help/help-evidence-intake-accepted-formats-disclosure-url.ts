export const HELP_EVIDENCE_INTAKE_ACCEPTED_FORMATS_OPEN_PARAM = "helpEvidenceIntakeAcceptedFormatsOpen";

export function parseHelpEvidenceIntakeAcceptedFormatsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpEvidenceIntakeAcceptedFormatsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(HELP_EVIDENCE_INTAKE_ACCEPTED_FORMATS_OPEN_PARAM);
  } else {
    params.set(HELP_EVIDENCE_INTAKE_ACCEPTED_FORMATS_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
