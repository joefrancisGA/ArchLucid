import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (packKey ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(HELP_ACCELERATOR_CHOOSER_PACK_TECHNICAL_KEY_PARAM);
    } else {
      params.set(HELP_ACCELERATOR_CHOOSER_PACK_TECHNICAL_KEY_PARAM, trimmed);
    }
    },
  });
}
