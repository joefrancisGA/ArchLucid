/** Separator between visible nav label and hover description in nav config `title` strings. */
export const NAV_LINK_TOOLTIP_SEPARATOR = " — ";

/**
 * Sidebar links already show the label; tooltips should carry only the descriptive suffix.
 * Nav config keeps "Label — description" for authoring; presentation strips the redundant prefix.
 */
export function resolveNavLinkTooltipTitle(label: string, title: string): string {
  const trimmedLabel = label.trim();
  const trimmedTitle = title.trim();

  if (trimmedLabel.length === 0 || trimmedTitle.length === 0) {
    return trimmedTitle;
  }

  const prefix = `${trimmedLabel}${NAV_LINK_TOOLTIP_SEPARATOR}`;

  if (trimmedTitle.startsWith(prefix)) {
    return trimmedTitle.slice(prefix.length).trim();
  }

  return trimmedTitle;
}
