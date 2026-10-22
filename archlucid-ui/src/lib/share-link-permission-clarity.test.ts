import { describe, expect, it } from "vitest";

import {
  assertShareLinkPermissionClarityMatrixComplete,
  getShareLinkPermissionClarityRows,
  SHARE_LINK_PERMISSION_CLARITY_INTRO,
  SHARE_LINK_PERMISSION_CLARITY_ROWS,
  SHARE_LINK_PERMISSION_CLARITY_TITLE,
  shareLinkPermissionClarityRowById,
} from "@/lib/share-link-permission-clarity";

describe("share-link-permission-clarity (TB-2212)", () => {
  it("exposes a stable title and intro beyond tenant-policy-only copy", () => {
    expect(SHARE_LINK_PERMISSION_CLARITY_TITLE).toBe("What this link allows");
    expect(SHARE_LINK_PERMISSION_CLARITY_INTRO.toLowerCase()).toContain("invite");
    expect(SHARE_LINK_PERMISSION_CLARITY_INTRO.toLowerCase()).toContain("export");
    expect(SHARE_LINK_PERMISSION_CLARITY_INTRO.toLowerCase()).toContain("who can open");
    expect(SHARE_LINK_PERMISSION_CLARITY_INTRO.toLowerCase()).not.toBe(
      "scope and retention follow your tenant policy.",
    );
  });

  it("defines matrix rows for whoCanOpen, expires, canExport, and vsInvite", () => {
    assertShareLinkPermissionClarityMatrixComplete();

    const rows = getShareLinkPermissionClarityRows();

    expect(rows).toHaveLength(4);
    expect(rows.map((row) => row.id)).toEqual(["whoCanOpen", "expires", "canExport", "vsInvite"]);
    expect(SHARE_LINK_PERMISSION_CLARITY_ROWS).toEqual(rows);
  });

  it("keeps who-can-open and export limits distinct from an invite", () => {
    const whoCanOpen = shareLinkPermissionClarityRowById("whoCanOpen");
    const canExport = shareLinkPermissionClarityRowById("canExport");
    const vsInvite = shareLinkPermissionClarityRowById("vsInvite");
    const expires = shareLinkPermissionClarityRowById("expires");

    expect(whoCanOpen.detail.toLowerCase()).toContain("url");
    expect(whoCanOpen.detail.toLowerCase()).toMatch(/read-only|showcase|preview/);
    expect(canExport.detail.toLowerCase()).toMatch(/cannot|not/);
    expect(vsInvite.detail.toLowerCase()).toContain("invite");
    expect(vsInvite.detail.toLowerCase()).toMatch(/membership|identity|permissions/);
    expect(expires.detail.toLowerCase()).toMatch(/expir|circulat/);
  });
});