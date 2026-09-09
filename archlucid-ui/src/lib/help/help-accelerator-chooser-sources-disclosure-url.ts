export const HELP_ACCELERATOR_CHOOSER_SOURCES_OPEN_PARAM = "helpAcceleratorChooserSourcesOpen";

export function parseHelpAcceleratorChooserSourcesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpAcceleratorChooserSourcesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(HELP_ACCELERATOR_CHOOSER_SOURCES_OPEN_PARAM);
  } else {
    params.set(HELP_ACCELERATOR_CHOOSER_SOURCES_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
