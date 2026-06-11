/**
 * Action-oriented command palette entries (navigate + pre-filled intent).
 */

export type CommandPaletteAction = {
  id: string;
  label: string;
  href: string;
  searchValue: string;
};

export const COMMAND_PALETTE_ACTIONS: readonly CommandPaletteAction[] = [
  {
    id: "action-create-review",
    label: "Create architecture review",
    href: "/reviews/new",
    searchValue: "action create new review package wizard",
  },
  {
    id: "action-open-reviews",
    label: "Open reviews list",
    href: "/reviews?projectId=default",
    searchValue: "action open list reviews packages",
  },
  {
    id: "action-export-value",
    label: "Open value report",
    href: "/value-report",
    searchValue: "action export roi sponsor value report",
  },
  {
    id: "action-search-audit",
    label: "Search audit trail",
    href: "/audit",
    searchValue: "action search audit log events export",
  },
  {
    id: "action-finish-setup",
    label: "Finish workspace setup",
    href: "/onboarding#finish-setup",
    searchValue: "action finish setup sso admin identity",
  },
  {
    id: "action-quality-settings",
    label: "Configure AI quality gates",
    href: "/settings/tenant",
    searchValue: "action quality gate llm judge settings",
  },
];
