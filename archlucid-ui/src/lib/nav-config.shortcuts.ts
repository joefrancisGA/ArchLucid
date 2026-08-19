import { registryKeyToAriaKeyShortcuts } from "@/lib/shortcut-registry";

/** Tooltip title including human-readable shortcut suffix from the shortcut registry. */
export function navTitleWithShortcut(baseTitle: string, registryCombo: string): string {
  const aria = registryKeyToAriaKeyShortcuts(registryCombo);

  return `${baseTitle} (${aria})`;
}
