import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import {
  PREFERENCES_HELP_TOPIC_LABEL,
  PREFERENCES_SETTINGS_CANONICAL_PATH,
} from "@/lib/preferences-settings-evidence-copy";

export const PREFERENCES_HELP_PAGE_TITLE = "Preferences";

export const PREFERENCES_HELP_PAGE_SUBTITLE = "Personal settings saved to your account.";

export const PREFERENCES_HELP_OVERVIEW =
  "Preferences stores personal appearance choices for your signed-in profile. Changes apply across supported devices — they do not change workspace governance, billing, or signed-review diligence packages.";

export const PREFERENCES_HELP_PRIMARY_ACTION = {
  label: "Open preferences",
  href: PREFERENCES_SETTINGS_CANONICAL_PATH,
} as const;

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
    label: "Personal scope",
    detail: "No Admin role is required — preferences write only your own account record.",
  },
  {
    label: "Sign-in methods",
    detail: "Open account security when sign-in controls need attention.",
  },
  {
    label: "Onboarding",
    detail: "Getting started help covers first-review workflow when preferences are not the blocker.",
  },
] as const;

export const PREFERENCES_HELP_HOW_TO_READ_STEPS = [
  "Choose a theme that matches how you review architecture evidence.",
  "Confirm preferences saved after the API responds.",
  "Open sign-in methods or getting started when personal settings turn into account or onboarding questions.",
] as const;

export const PREFERENCES_HELP_GETTING_STARTED_HREF = "/help/getting-started";

export const PREFERENCES_HELP_SIGN_IN_METHODS_HREF = "/administration/account-security";

export const PREFERENCES_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-preferences-cover", title: "What preferences cover" },
  { level: 2, id: "how-preferences-work", title: PREFERENCES_HELP_TOPIC_LABEL },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
