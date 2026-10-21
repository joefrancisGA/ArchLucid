import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, HELP_PATH_CHOOSER_REFERENCE_APPENDIX_OPEN_PARAM);
}
