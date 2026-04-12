import { describe, expect, it } from "vitest";

import { parseKeyCombo } from "@/hooks/useKeyboardShortcuts";
import { SHORTCUTS } from "@/lib/shortcut-registry";

/** Common browser / OS shortcuts we intentionally avoid mirroring with our registry combos. */
const COMMON_BROWSER_COMBOS_NORMALIZED = [
  "ctrl+c",
  "ctrl+v",
  "ctrl+t",
  "ctrl+w",
  "ctrl+n",
  "ctrl+shift+n",
  "ctrl+shift+t",
  "meta+c",
  "meta+v",
  "meta+t",
  "meta+w",
  "meta+n",
];

function normalizeCombo(combo: string): string {
  return combo.toLowerCase().trim().replace(/\s+/g, "");
}

describe("keyboard shortcuts registry — no collision with browser chrome (integration/data)", () => {
  it("has no duplicate normalized keys in SHORTCUTS", () => {
    const seen = new Set<string>();

    for (const entry of SHORTCUTS) {
      const normalized = normalizeCombo(entry.key);
      expect(seen.has(normalized), `duplicate combo: ${entry.key}`).toBe(false);
      seen.add(normalized);
    }
  });

  it("uses Alt for navigation shortcuts and Shift for help only (no Ctrl/Meta on registry entries)", () => {
    for (const entry of SHORTCUTS) {
      const parsed = parseKeyCombo(entry.key);

      expect(parsed.ctrl, entry.key).toBe(false);
      expect(parsed.meta, entry.key).toBe(false);

      const isHelp = normalizeCombo(entry.key) === "shift+?";

      if (isHelp) {
        expect(parsed.shift, entry.key).toBe(true);
        expect(parsed.alt, entry.key).toBe(false);
      } else {
        expect(parsed.alt, entry.key).toBe(true);
        expect(parsed.shift, entry.key).toBe(false);
      }
    }
  });

  it("does not register combos that match normalized common browser shortcuts", () => {
    const registryNormalized = SHORTCUTS.map((e) => normalizeCombo(e.key));

    for (const browserCombo of COMMON_BROWSER_COMBOS_NORMALIZED) {
      expect(registryNormalized).not.toContain(browserCombo);
    }
  });

  it("uses single-character base keys or ? for help — no F-keys that overlap refresh conventions", () => {
    for (const entry of SHORTCUTS) {
      const parsed = parseKeyCombo(entry.key);
      const base = parsed.key.toLowerCase();

      if (base === "?") {
        continue;
      }

      expect(base.length, entry.key).toBe(1);
      expect(base.startsWith("f"), `${entry.key} should not use F-keys`).toBe(false);
    }
  });
});
