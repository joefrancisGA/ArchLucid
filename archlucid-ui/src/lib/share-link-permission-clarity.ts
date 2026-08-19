/**
 * Source of truth for share-link create-time permission clarity (TB-2212).
 * Distinct from cold shared-link unpack (TB-2181) - recipient cold-open orientation.
 */

export type ShareLinkPermissionClarityRowId = "whoCanOpen" | "expires" | "canExport" | "vsInvite";

export type ShareLinkPermissionClarityRow = {
  readonly id: ShareLinkPermissionClarityRowId;
  readonly label: string;
  readonly detail: string;
};

export const SHARE_LINK_PERMISSION_CLARITY_TITLE = "What this link allows" as const;

export const SHARE_LINK_PERMISSION_CLARITY_INTRO =
  "Confirm who can open the URL, whether it expires, export limits, and how a share link differs from an invite - not only that access follows tenant policy." as const;

export const SHARE_LINK_PERMISSION_CLARITY_ROWS: readonly ShareLinkPermissionClarityRow[] = [
  {
    id: "whoCanOpen",
    label: "Who can open",
    detail:
      "Anyone with the URL can open the read-only showcase preview. They do not need an ArchLucid account for that preview.",
  },
  {
    id: "expires",
    label: "Expires",
    detail:
      "This create flow does not set a per-link expiry. Treat the URL as usable until you stop circulating it; package retention still follows your tenant settings.",
  },
  {
    id: "canExport",
    label: "Can export",
    detail:
      "Link recipients cannot create operator deliverables or download sealed review records from the link alone.",
  },
  {
    id: "vsInvite",
    label: "Vs invite",
    detail:
      "An invite adds a signed-in reviewer identity in your tenant (Reader/Auditor capabilities). A share link only hands off a URL - it does not grant membership or invitee permissions.",
  },
] as const;

const ROW_IDS: readonly ShareLinkPermissionClarityRowId[] = [
  "whoCanOpen",
  "expires",
  "canExport",
  "vsInvite",
] as const;

/** Stable matrix for the create-time clarity panel. */
export function getShareLinkPermissionClarityRows(): readonly ShareLinkPermissionClarityRow[] {
  return SHARE_LINK_PERMISSION_CLARITY_ROWS;
}

export function shareLinkPermissionClarityRowById(
  id: ShareLinkPermissionClarityRowId,
): ShareLinkPermissionClarityRow {
  const row = SHARE_LINK_PERMISSION_CLARITY_ROWS.find((candidate) => candidate.id === id);

  if (row === undefined) {
    throw new Error(`Missing share-link permission clarity row: ${id}`);
  }

  return row;
}

/** Guard for tests - matrix must cover every declared row id exactly once. */
export function assertShareLinkPermissionClarityMatrixComplete(): void {
  const ids = SHARE_LINK_PERMISSION_CLARITY_ROWS.map((row) => row.id);

  for (const expected of ROW_IDS) {
    if (!ids.includes(expected)) {
      throw new Error(`Share-link permission clarity matrix missing row: ${expected}`);
    }
  }

  if (ids.length !== ROW_IDS.length) {
    throw new Error("Share-link permission clarity matrix has unexpected row count.");
  }
}