import { afterEach, describe, expect, it, vi } from "vitest";

import {
  KEYBOARD_SHORTCUTS_DISCOVERABILITY_DISMISS_KEY,
  KEYBOARD_SHORTCUTS_DISCOVERABILITY_DISMISS_LABEL,
  KEYBOARD_SHORTCUTS_DISCOVERABILITY_HEADING,
  KEYBOARD_SHORTCUTS_DISCOVERABILITY_HINTS,
  KEYBOARD_SHORTCUTS_DISCOVERABILITY_LEAD,
  buildKeyboardShortcutsDiscoverability,
  dismissKeyboardShortcutsDiscoverability,
  isKeyboardShortcutsDiscoverabilityDismissed,
} from "@/lib/keyboard-shortcuts-discoverability";

describe("keyboard-shortcuts-discoverability (TB-2268)", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("teaches help, palette, and where-to-look in buyer nouns", () => {
    const model = buildKeyboardShortcutsDiscoverability();

    expect(model.heading).toBe(KEYBOARD_SHORTCUTS_DISCOVERABILITY_HEADING);
    expect(model.lead).toBe(KEYBOARD_SHORTCUTS_DISCOVERABILITY_LEAD);
    expect(model.lead.toLowerCase()).toContain("f1");
    expect(model.lead.toLowerCase()).toContain("shift+?");
    expect(model.lead.toLowerCase()).toContain("shortcuts");
    expect(model.dismissLabel).toBe(KEYBOARD_SHORTCUTS_DISCOVERABILITY_DISMISS_LABEL);

    expect(model.hints).toEqual(KEYBOARD_SHORTCUTS_DISCOVERABILITY_HINTS);
    expect(model.hints.map((hint) => hint.id)).toEqual(["help", "palette", "where"]);
    expect(model.hints[0]?.body.toLowerCase()).toContain("help");
    expect(model.hints[1]?.body.toLowerCase()).toContain("ctrl+k");
    expect(model.hints[2]?.body.toLowerCase()).toContain("shortcuts tab");
  });

  it("reads and writes the localStorage dismiss key", () => {
    expect(isKeyboardShortcutsDiscoverabilityDismissed()).toBe(false);

    dismissKeyboardShortcutsDiscoverability();

    expect(window.localStorage.getItem(KEYBOARD_SHORTCUTS_DISCOVERABILITY_DISMISS_KEY)).toBe(
      "1",
    );
    expect(isKeyboardShortcutsDiscoverabilityDismissed()).toBe(true);
  });

  it("treats localStorage failures as dismissed (private mode)", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("quota");
    });

    expect(isKeyboardShortcutsDiscoverabilityDismissed()).toBe(true);
  });
});
