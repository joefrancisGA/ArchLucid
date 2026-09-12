import { WORKING_CAREER_REHEARSAL_DOOR_SHORTCUT_DESCRIPTION } from "@/lib/governance/working-career-rehearsal-door-copy";
import type { PageShortcutEntry } from "@/lib/shortcut-registry";

/** Global Working door cycle — Alt+Shift+E (execution door). */
export const WORKING_CAREER_REHEARSAL_DOOR_SHORTCUT_KEY = "alt+shift+e";

export const WORKING_CAREER_REHEARSAL_DOOR_SHORTCUTS: PageShortcutEntry[] = [
  {
    key: WORKING_CAREER_REHEARSAL_DOOR_SHORTCUT_KEY,
    label: "Review type",
    description: WORKING_CAREER_REHEARSAL_DOOR_SHORTCUT_DESCRIPTION,
  },
];
