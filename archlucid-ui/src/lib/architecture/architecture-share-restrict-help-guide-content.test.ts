import { describe, expect, it } from "vitest";

import { ARCHITECTURE_SHARE_ROLES } from "@/lib/architecture/architecture-share-validation";
import {
  ARCHITECTURE_SHARE_RESTRICT_HELP_BOUNDARY_COPY,
  ARCHITECTURE_SHARE_RESTRICT_HELP_FORBIDDEN_LINK_MARKERS,
  ARCHITECTURE_SHARE_RESTRICT_HELP_GRANDFATHER_COPY,
  ARCHITECTURE_SHARE_RESTRICT_HELP_ONE_TENANT_COPY,
  ARCHITECTURE_SHARE_RESTRICT_HELP_ONE_TENANT_TITLE,
  ARCHITECTURE_SHARE_RESTRICT_HELP_OVERVIEW,
  ARCHITECTURE_SHARE_RESTRICT_HELP_PAGE_TITLE,
  ARCHITECTURE_SHARE_RESTRICT_HELP_PRIMARY_ACTION,
  ARCHITECTURE_SHARE_RESTRICT_HELP_RELATED,
  ARCHITECTURE_SHARE_RESTRICT_HELP_ROLE_TILES,
} from "@/lib/architecture/architecture-share-restrict-help-guide-content";

describe("architecture-share-restrict-help-guide-content (AS-098)", () => {
  it("names restrict-to-shares, roles, and grandfather default", () => {
    expect(ARCHITECTURE_SHARE_RESTRICT_HELP_PAGE_TITLE).toContain("sharing");
    expect(ARCHITECTURE_SHARE_RESTRICT_HELP_OVERVIEW.toLowerCase()).toContain("restrict-to-shares");
    expect(ARCHITECTURE_SHARE_RESTRICT_HELP_GRANDFATHER_COPY.toLowerCase()).toContain("opt-in");
    expect(ARCHITECTURE_SHARE_RESTRICT_HELP_ROLE_TILES.map((tile) => tile.id)).toEqual([
      ...ARCHITECTURE_SHARE_ROLES,
    ]);
  });

  it("states one tenant boundary and refuses chat or presence", () => {
    expect(ARCHITECTURE_SHARE_RESTRICT_HELP_ONE_TENANT_TITLE.toLowerCase()).toContain("one");
    expect(ARCHITECTURE_SHARE_RESTRICT_HELP_ONE_TENANT_COPY.toLowerCase()).toContain("second tenant");
    expect(ARCHITECTURE_SHARE_RESTRICT_HELP_BOUNDARY_COPY.toLowerCase()).toContain("chat");
    expect(ARCHITECTURE_SHARE_RESTRICT_HELP_BOUNDARY_COPY.toLowerCase()).toContain("presence");
  });

  it("uses in-app help links only — no GitHub blob URLs", () => {
    const serialized = JSON.stringify({
      overview: ARCHITECTURE_SHARE_RESTRICT_HELP_OVERVIEW,
      grandfather: ARCHITECTURE_SHARE_RESTRICT_HELP_GRANDFATHER_COPY,
      oneTenant: ARCHITECTURE_SHARE_RESTRICT_HELP_ONE_TENANT_COPY,
      boundary: ARCHITECTURE_SHARE_RESTRICT_HELP_BOUNDARY_COPY,
      primary: ARCHITECTURE_SHARE_RESTRICT_HELP_PRIMARY_ACTION,
      related: ARCHITECTURE_SHARE_RESTRICT_HELP_RELATED,
      tiles: ARCHITECTURE_SHARE_RESTRICT_HELP_ROLE_TILES,
    });

    for (const marker of ARCHITECTURE_SHARE_RESTRICT_HELP_FORBIDDEN_LINK_MARKERS) {
      expect(serialized).not.toContain(marker);
    }

    expect(ARCHITECTURE_SHARE_RESTRICT_HELP_PRIMARY_ACTION.href.startsWith("/help/")).toBe(true);
    expect(ARCHITECTURE_SHARE_RESTRICT_HELP_RELATED.href.startsWith("/help/")).toBe(true);
  });
});
