export const HELP_PATH_CHOOSER_REFERENCE_APPENDIX_OPEN_PARAM = "helpPathChooserReferenceAppendixOpen";

export function parseHelpPathChooserReferenceAppendixOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpPathChooserReferenceAppendixDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(HELP_PATH_CHOOSER_REFERENCE_APPENDIX_OPEN_PARAM);
  } else {
    params.set(HELP_PATH_CHOOSER_REFERENCE_APPENDIX_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
