/** Preferences surface and its help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import {
  PREFERENCES_HELP_TOPIC_LABEL,
  PREFERENCES_SETTINGS_CANONICAL_PATH,
} from "@/lib/preferences-settings-evidence-copy";
import { PREFERENCES_HELP_CANONICAL_PATH } from "@/lib/preferences-help-evidence-copy";

const PREFERENCES_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Preferences — personal appearance settings for this device and signed-in profile.",
  whatToDoNext:
    "Choose a theme, then open Sign-in methods when sign-in controls need attention or Getting started for onboarding.",
  whyEmpty:
    "Theme controls are ready whenever you are signed in.",
  whereToConfigurePrerequisite:
    "No Admin role is required — preferences write only your own account record.",
  taskSteps: [
    "Choose a theme for this signed-in profile.",
    "Confirm the preferences page reflects your selection.",
    "Open Sign-in methods when account security needs attention.",
  ],
} as const;

export const PREFERENCES_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: PREFERENCES_SETTINGS_CANONICAL_PATH,
    entry: PREFERENCES_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: PREFERENCES_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `Preferences — ${PREFERENCES_HELP_TOPIC_LABEL.toLowerCase()} and how personal theme settings differ from workspace controls.`,
      whatToDoNext:
        "Open preferences to choose appearance settings, then follow sign-in methods or getting started help for related account questions.",
      whyEmpty: "This guide is always available; theme controls render whenever you are signed in.",
      whereToConfigurePrerequisite:
        "Sign-in methods and getting started help cover account security and onboarding follow-ups.",
      whatToDoNextAction: {
        label: "Open preferences",
        href: PREFERENCES_SETTINGS_CANONICAL_PATH,
      },
      whereToConfigureAction: {
        label: "Read getting started help",
        href: "/help/getting-started",
      },
    },
  },
];
