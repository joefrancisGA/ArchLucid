export const HELP_ACCELERATOR_CHOOSER_PACK_TECHNICAL_KEY_PARAM = "helpAcceleratorChooserPackTechnicalKey";

export function parseHelpAcceleratorChooserPackTechnicalKeyFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function helpAcceleratorChooserPackTechnicalDisclosureHrefFromSearch(
  currentSearch: string,
  packKey: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (packKey ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(HELP_ACCELERATOR_CHOOSER_PACK_TECHNICAL_KEY_PARAM);
  } else {
    params.set(HELP_ACCELERATOR_CHOOSER_PACK_TECHNICAL_KEY_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
