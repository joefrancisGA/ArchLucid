export const COMMAND_PALETTE_OPEN_PARAM = "paletteOpen";
export const COMMAND_PALETTE_QUERY_PARAM = "paletteQ";

export type CommandPaletteOverlayUrlState = {
  readonly open: boolean;
  readonly query: string;
};

export function parseCommandPaletteOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseCommandPaletteQueryFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function commandPaletteOverlayHrefFromSearch(
  currentSearch: string,
  state: CommandPaletteOverlayUrlState,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const query = state.query.trim();

  if (!state.open) {
    params.delete(COMMAND_PALETTE_OPEN_PARAM);
    params.delete(COMMAND_PALETTE_QUERY_PARAM);
  } else {
    params.set(COMMAND_PALETTE_OPEN_PARAM, "1");

    if (query.length === 0) {
      params.delete(COMMAND_PALETTE_QUERY_PARAM);
    } else {
      params.set(COMMAND_PALETTE_QUERY_PARAM, query);
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
