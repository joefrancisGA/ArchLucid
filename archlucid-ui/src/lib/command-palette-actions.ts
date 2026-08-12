/**
 * Action-oriented command palette entries (navigate + pre-filled intent).
 */

import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH } from "@/lib/sponsor-report-navigation";

export type CommandPaletteAction = {
  id: string;
  label: string;
  href: string;
  searchValue: string;
};

export const COMMAND_PALETTE_ACTIONS: readonly CommandPaletteAction[] = [
  {
    id: "action-create-review",
    label: CREATE_ARCHITECTURE_LABEL,
    href: "/architecture/reviews/new",
    searchValue: "action create new review wizard",
  },
  {
    id: "action-open-reviews",
    label: "Open reviews list",
    href: "/architecture/reviews",
    searchValue: "action open list reviews packages",
  },
  {
    id: "action-export-value",
    label: "Open value report",
    href: SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
    searchValue: "action export roi sponsor value report",
  },
  {
    id: "action-search-audit",
    label: "Search audit trail",
    href: GOVERNANCE_AUDIT_PATH,
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
    href: "/administration/tenant",
    searchValue: "action quality gate llm judge settings",
  },
];
