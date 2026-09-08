import { describe, expect, it } from "vitest";

import { isArchitectureIdentityDeskPath } from "@/lib/architecture/is-architecture-identity-desk-path";
import {
  ARCHITECTURES_LIST_PATH,
  architectureIdentityDraftHref,
  architectureIdentityPath,
  architectureNestedReviewPath,
} from "@/lib/architecture/architecture-routes";
import { ARCHITECTURE_DESK_PAGE_SHORTCUTS } from "@/lib/shortcut-registry";

describe("isArchitectureIdentityDeskPath (AO-43)", () => {
  it("matches architecture identity desks only", () => {
    expect(isArchitectureIdentityDeskPath(architectureIdentityPath("architecture-identity-001"))).toBe(true);
    expect(isArchitectureIdentityDeskPath(ARCHITECTURES_LIST_PATH)).toBe(false);
    expect(isArchitectureIdentityDeskPath(`${ARCHITECTURES_LIST_PATH}/new`)).toBe(false);
    expect(
      isArchitectureIdentityDeskPath(
        architectureIdentityDraftHref("architecture-identity-001", "draft-1"),
      ),
    ).toBe(false);
    expect(
      isArchitectureIdentityDeskPath(
        architectureNestedReviewPath("architecture-identity-001", "review-1"),
      ),
    ).toBe(false);
  });
});

describe("ARCHITECTURE_DESK_PAGE_SHORTCUTS (AO-43)", () => {
  it("documents modifier-based desk shortcuts only", () => {
    expect(ARCHITECTURE_DESK_PAGE_SHORTCUTS.length).toBeGreaterThan(0);

    for (const entry of ARCHITECTURE_DESK_PAGE_SHORTCUTS) {
      expect(entry.key).toMatch(/\+/);
      expect(entry.description.toLowerCase()).not.toContain("peer review");
    }
  });

  it("lists start, draft, in-flight, and save actions for the desk", () => {
    const keys = ARCHITECTURE_DESK_PAGE_SHORTCUTS.map((entry) => entry.key);

    expect(keys).toContain("alt+n");
    expect(keys).toContain("alt+shift+r");
    expect(keys).toContain("alt+shift+d");
    expect(keys).toContain("alt+shift+i");
    expect(keys).toContain("ctrl+shift+s");
  });
});
