/**
 * Teaching chrome surfaces hidden when workspace mode is Working.
 * Guided mode shows these; Working mode keeps live work surfaces only.
 */
export const GUIDED_TEACHING_CHROME_SURFACE_IDS = [
  "shell-shortcut-coaches",
  "first-visit-help-auto-open",
  "explain-this-view-banner",
  "contextual-page-hint-strip",
  "core-pilot-celebrate-strip",
  "opt-in-tour-launcher",
  "findings-triage-first-finding-strip",
  "help-panel-core-pilot-pin",
  "where-to-go-next-strips",
  "sample-reviews-on-overview",
  "keyboard-shortcuts-coach",
  "global-search-shortcut-coach",
  "persistent-workspace-next-action-strip",
] as const;

export type GuidedTeachingChromeSurfaceId = (typeof GUIDED_TEACHING_CHROME_SURFACE_IDS)[number];
