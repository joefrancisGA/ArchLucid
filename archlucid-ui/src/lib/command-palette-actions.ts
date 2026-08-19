/**
 * Action-oriented command palette entries (navigate + pre-filled intent).
 *
 * Verb phrasing is intentional here — these sit beside destination rows, so "Open …" / "Search …"
 * signals an action. The **noun** inside the phrase still comes from the destination's own name via
 * {@link getRouteTitle}, so an action cannot outlive a page rename (this row previously offered
 * "Open value report" for the page titled "Sponsor report", and labelled review intake
 * "Create architecture", which is the name of the separate architecture-draft route).
 */

import {
  FIRST_REVIEW_GUIDE_PATH,
  ONBOARDING_OPTIONAL_SETUP_HEADING_ID,
} from "@/lib/first-review-guide-route";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { getRouteTitle } from "@/lib/route-titles";
import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";

export type CommandPaletteAction = {
  id: string;
  label: string;
  href: string;
  searchValue: string;
};

/** "Open" + the destination's canonical name, lower-cased so the phrase stays sentence-case. */
function openDestinationLabel(href: string): string {
  return `Open ${getRouteTitle(href).toLowerCase()}`;
}

export const COMMAND_PALETTE_ACTIONS: readonly CommandPaletteAction[] = [
  {
    id: "action-create-review",
    label: getRouteTitle("/architecture/reviews/new"),
    href: "/architecture/reviews/new",
    searchValue: "action create new review wizard intake",
  },
  {
    id: "action-open-reviews",
    label: openDestinationLabel("/architecture/reviews"),
    href: "/architecture/reviews",
    searchValue: "action open list reviews packages",
  },
  {
    id: "action-export-value",
    label: openDestinationLabel(SPONSOR_REPORT_PATH),
    href: SPONSOR_REPORT_PATH,
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
    href: `${FIRST_REVIEW_GUIDE_PATH}#${ONBOARDING_OPTIONAL_SETUP_HEADING_ID}`,
    searchValue: "action finish setup sso admin identity",
  },
  {
    id: "action-quality-settings",
    label: "Configure AI quality gates",
    href: "/administration/workspace-settings",
    searchValue: "action quality gate llm judge settings",
  },
];
