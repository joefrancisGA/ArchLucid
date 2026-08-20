import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { PREFERENCES_HELP_CLAIM_DISCIPLINE_HEADING } from "@/lib/preferences-help-evidence-copy";
import { PREFERENCES_SETTINGS_CANONICAL_PATH } from "@/lib/preferences-settings-evidence-copy";

export const PREFERENCES_HELP_PAGE_TITLE = "Preferences";

export const PREFERENCES_HELP_PAGE_SUBTITLE = "Personal settings saved to your account.";

export const PREFERENCES_HELP_OVERVIEW =
  "Preferences stores personal appearance choices for your signed-in profile. Theme selections save to your account and apply the next time you sign in on any browser.";

export const PREFERENCES_HELP_START_HERE_CARD_TITLE = "Start here";

/**
 * Preferences is reached from the top-bar account menu, not the administration hub — naming
 * Administration here is what made readers assume an Admin role was required.
 */
export const PREFERENCES_HELP_START_HERE_HELPER =
  "Open Preferences from your account menu to choose light, dark, or system appearance for your signed-in profile.";

export const PREFERENCES_HELP_PRIMARY_ACTION = {
  label: "Open preferences",
  href: PREFERENCES_SETTINGS_CANONICAL_PATH,
} as const;

export const PREFERENCES_HELP_HOW_SECTION_TITLE = "How preferences work";

export type PreferencesHelpTileItem = {
  readonly label: string;
  readonly detail: string;
};

export const PREFERENCES_HELP_TILE_ITEMS: readonly PreferencesHelpTileItem[] = [
  {
    label: "Theme",
    detail: "Light, dark, or system appearance saved to your account.",
  },
  {
    label: "Where it saves",
    detail: "Appearance choices save to your signed-in profile only.",
  },
] as const;

export const PREFERENCES_HELP_CHANGES_SECTION_TITLE = "What changes and what does not";

export const PREFERENCES_HELP_CHANGES_ITEMS: readonly PreferencesHelpTileItem[] = [
  {
    label: "Changes",
    detail: "Personal theme and appearance choices for your signed-in profile.",
  },
  {
    label: "Does not change",
    detail: "Workspace governance, billing, full audit exports, or tenant-wide defaults.",
  },
] as const;

export const PREFERENCES_HELP_HOW_TO_READ_STEPS = [
  "Choose a theme that matches how you review architecture evidence.",
  "Save appearance choices and confirm the preferences page reflects your selection.",
  "Use the related links below when personal settings lead to onboarding, account security, or assurance questions.",
] as const;

export const PREFERENCES_HELP_CLAIM_HEADING_ID = "help-preferences-claim-discipline-heading" as const;

export const PREFERENCES_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-preferences-cover", title: "What preferences cover" },
  { level: 2, id: "what-changes-and-what-does-not", title: PREFERENCES_HELP_CHANGES_SECTION_TITLE },
  { level: 2, id: "how-preferences-work", title: PREFERENCES_HELP_HOW_SECTION_TITLE },
  {
    level: 2,
    id: PREFERENCES_HELP_CLAIM_HEADING_ID,
    title: PREFERENCES_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];

/** Drift guard: overview stays positive-only; claim band owns the audit-export negation once. */
export const PREFERENCES_HELP_NEGATION_DRIFT_MARKERS = {
  overviewMustNotContain: [
    "not a full audit export",
    "sources package",
    "Sources package",
    "does not change",
  ],
  claimMustContain: "not a full audit export",
} as const;
