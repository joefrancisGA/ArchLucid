"use client";

import { useCallback, useEffect, useRef } from "react";

export type KeyboardShortcutHandler = {
  handler: () => void;
  description: string;
  /** When true, shortcut runs even if focus is in an editable field. */
  allowInInput?: boolean;
};

export type KeyboardShortcutsMap = Record<string, KeyboardShortcutHandler>;

/**
 * Parses combo strings like `alt+n`, `shift+?` into modifier flags + base key.
 * We standardize on **Alt** (Option on macOS) for letter shortcuts so we avoid
 * Ctrl/Cmd clashes with the browser (e.g. Ctrl+N new window, Ctrl+C copy) and
 * keep shortcuts usable in an internal operator shell where Alt+letter is acceptable.
 */
export function parseKeyCombo(combo: string): {
  key: string;
  alt: boolean;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
} {
  const parts = combo
    .toLowerCase()
    .trim()
    .split("+")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { key: "", alt: false, ctrl: false, meta: false, shift: false };
  }

  const key = parts[parts.length - 1];
  const mods = parts.slice(0, -1);

  return {
    key,
    alt: mods.includes("alt"),
    ctrl: mods.includes("ctrl") || mods.includes("control"),
    meta: mods.includes("meta") || mods.includes("cmd"),
    shift: mods.includes("shift"),
  };
}

function eventKeyMatchesBaseKey(eventKey: string, baseKey: string): boolean {
  if (baseKey.length === 1 && /[a-z0-9]/.test(baseKey)) {
    return eventKey.length === 1 && eventKey.toLowerCase() === baseKey.toLowerCase();
  }

  return eventKey === baseKey || eventKey.toLowerCase() === baseKey.toLowerCase();
}

/** True if the keyboard event satisfies the combo (exact modifier set + key). */
export function keyEventMatchesCombo(event: KeyboardEvent, combo: string): boolean {
  const parsed = parseKeyCombo(combo);

  if (!parsed.key) {
    return false;
  }

  if (event.altKey !== parsed.alt) {
    return false;
  }

  if (event.ctrlKey !== parsed.ctrl) {
    return false;
  }

  if (event.metaKey !== parsed.meta) {
    return false;
  }

  if (event.shiftKey !== parsed.shift) {
    return false;
  }

  return eventKeyMatchesBaseKey(event.key, parsed.key);
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName;

  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return true;
  }

  if (target.isContentEditable) {
    return true;
  }

  return false;
}

/**
 * Registers global `keydown` shortcuts. One listener; reads latest map from a ref
 * so the callback identity stays stable.
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcutsMap): void {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const listener = useCallback((event: KeyboardEvent) => {
    const map = shortcutsRef.current;

    for (const [combo, entry] of Object.entries(map)) {
      if (!keyEventMatchesCombo(event, combo)) {
        continue;
      }

      if (isEditableTarget(event.target) && !entry.allowInInput) {
        continue;
      }

      event.preventDefault();
      entry.handler();

      return;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", listener);

    return () => window.removeEventListener("keydown", listener);
  }, [listener]);
}
