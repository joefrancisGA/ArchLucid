import { describe, expect, it } from "vitest";

import { findShortcutByKey } from "@/lib/shortcut-registry";

describe("shortcut-registry architect-safe alt+p", () => {
  it("routes alt+p to policy packs instead of internal validate route", () => {
    const entry = findShortcutByKey("alt+p");

    expect(entry?.route).toBe("/governance/policy-packs");
    expect(entry?.label).toBe("Policy packs");
  });
});
