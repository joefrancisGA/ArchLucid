import { describe, expect, it } from "vitest";

import { BUYER_NEW_REVIEW_NAV_LABEL } from "@/lib/operator/operator-nav-labels";
import {
  ALERTS_PAGE_SHORTCUTS,
  ARCHITECTURE_DESK_PAGE_SHORTCUTS,
  GUIDED_ALT_N_SHORTCUT_DESCRIPTION,
  SHELL_COMMAND_SHORTCUTS,
  SHORTCUTS,
  WORKING_ALT_N_SHORTCUT_DESCRIPTION,
  WORKING_MODE_NEW_REVIEW_ROUTE,
  findShortcutByKey,
  registryKeyToAriaKeyShortcuts,
  resolveShortcutDescription,
} from "./shortcut-registry";

describe("shortcut-registry", () => {
  it("maps registry combo keys to aria-keyshortcuts form", () => {
    expect(registryKeyToAriaKeyShortcuts("alt+n")).toBe("Alt+N");
    expect(registryKeyToAriaKeyShortcuts("alt+r")).toBe("Alt+R");
    expect(registryKeyToAriaKeyShortcuts("shift+?")).toBe("Shift+?");
    expect(registryKeyToAriaKeyShortcuts("alt+1")).toBe("Alt+1");
    expect(registryKeyToAriaKeyShortcuts("alt+y")).toBe("Alt+Y");
  });

  it("has non-empty key, label, and description on every entry", () => {
    for (const entry of SHORTCUTS) {
      expect(entry.key.trim().length).toBeGreaterThan(0);
      expect(entry.label.trim().length).toBeGreaterThan(0);
      expect(entry.description.trim().length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate key combos (case-insensitive)", () => {
    const seen = new Set<string>();

    for (const entry of SHORTCUTS) {
      const normalized = entry.key.toLowerCase().trim();
      expect(seen.has(normalized)).toBe(false);
      seen.add(normalized);
    }
  });

  it("has valid page shortcut entries with no duplicate keys", () => {
    const seen = new Set<string>();

    for (const entry of ALERTS_PAGE_SHORTCUTS) {
      expect(entry.key.trim().length).toBeGreaterThan(0);
      expect(entry.label.trim().length).toBeGreaterThan(0);
      expect(entry.description.trim().length).toBeGreaterThan(0);

      const normalized = entry.key.toLowerCase().trim();
      expect(seen.has(normalized)).toBe(false);
      seen.add(normalized);
    }
  });

  it("does not overlap global shortcut combos with alerts page combos", () => {
    const globalKeys = new Set(SHORTCUTS.map((e) => e.key.toLowerCase().trim()));

    for (const entry of ALERTS_PAGE_SHORTCUTS) {
      expect(globalKeys.has(entry.key.toLowerCase().trim())).toBe(false);
    }
  });

  it("documents the command palette shortcut", () => {
    const palette = SHELL_COMMAND_SHORTCUTS.find((entry) => entry.key === "ctrl+k");

    expect(palette?.label).toBe("Command palette");
    expect(palette?.description).toMatch(/cmd\+k/i);
  });

  it("keeps shell command shortcuts out of the navigation registry so nothing is bound twice", () => {
    const navKeys = new Set(SHORTCUTS.map((entry) => entry.key.toLowerCase().trim()));

    for (const entry of SHELL_COMMAND_SHORTCUTS) {
      expect(navKeys.has(entry.key.toLowerCase().trim())).toBe(false);
      expect(findShortcutByKey(entry.key)).toBeUndefined();
    }
  });

  it("findShortcutByKey returns the matching entry regardless of casing", () => {
    const byLower = findShortcutByKey("alt+n");
    expect(byLower?.label).toBe(BUYER_NEW_REVIEW_NAV_LABEL);

    const byMixed = findShortcutByKey("Alt+N");
    expect(byMixed?.route).toBe(WORKING_MODE_NEW_REVIEW_ROUTE);

    const help = findShortcutByKey("Shift+?");
    expect(help?.label).toBe("Find help (Ctrl+K)");

    expect(findShortcutByKey("not-a-real-combo")).toBeUndefined();
  });

  it("AO-43: documents architecture desk work shortcuts before nested job shortcuts", () => {
    expect(ARCHITECTURE_DESK_PAGE_SHORTCUTS.length).toBeGreaterThan(0);
    expect(ARCHITECTURE_DESK_PAGE_SHORTCUTS[0]?.key).toBe("alt+n");
    expect(ARCHITECTURE_DESK_PAGE_SHORTCUTS[0]?.description).toBe(WORKING_ALT_N_SHORTCUT_DESCRIPTION);
  });

  it("LI-06: Alt+N descriptions distinguish Working draft editor from Guided wizard", () => {
    const altN = SHORTCUTS.find((entry) => entry.key === "alt+n");

    expect(altN).toBeDefined();
    expect(altN?.description).toBe(WORKING_ALT_N_SHORTCUT_DESCRIPTION);
    expect(altN?.description.toLowerCase()).not.toContain("wizard");
    expect(resolveShortcutDescription(altN!, true).toLowerCase()).not.toContain("wizard");
    expect(resolveShortcutDescription(altN!, false)).toBe(GUIDED_ALT_N_SHORTCUT_DESCRIPTION);
  });

  it("RS-08: on-review Working shortcuts describe package-scoped Ask and graph", () => {
    const altA = SHORTCUTS.find((entry) => entry.key === "alt+a");
    const altY = SHORTCUTS.find((entry) => entry.key === "alt+y");

    expect(altA).toBeDefined();
    expect(altY).toBeDefined();
    expect(resolveShortcutDescription(altA!, true, true)).toContain("scoped to this review");
    expect(resolveShortcutDescription(altY!, true, true)).toContain("scoped to this review");
  });
});
