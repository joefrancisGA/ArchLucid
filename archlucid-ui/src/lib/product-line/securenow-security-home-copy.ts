import { SECURENOW_REMEDIATION_INSTANCES_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import {
  SECURENOW_ASSIGNED_TO_ME_FINDINGS_PATH,
  SECURENOW_REMEDIATION_FACTORY_PATH,
  SECURENOW_REMEDIATION_PATTERNS_PATH,
} from "@/lib/governance/governance-route-paths";
import { SECURENOW_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";
import { SECURENOW_NAV_LABELS } from "@/lib/product-line/securenow-nav-labels";

export const SECURENOW_SECURITY_HOME_SECTION_HEADING = "Security" as const;

export const SECURENOW_SECURITY_HOME_SECTION_LEAD =
  "Triage security findings, create and run remediation factory workflows, review remediation patterns, and track remediation instances." as const;

/** SecureNow home — operational security destinations (integration links live under Integration nav). */
export const SECURENOW_SECURITY_HOME_ROWS: readonly SecureNowHomeDestinationRow[] = [
  {
    href: SECURENOW_ASSIGNED_TO_ME_FINDINGS_PATH,
    label: SECURENOW_NAV_LABELS[SECURENOW_ASSIGNED_TO_ME_FINDINGS_PATH],
    summary: "Open the findings assigned to you.",
    recommendedFirst: true,
  },
  {
    href: SECURENOW_REMEDIATION_FACTORY_PATH,
    label: SECURENOW_NAV_LABELS[SECURENOW_REMEDIATION_FACTORY_PATH],
    summary: "See which fixes to do first, and group them into waves.",
  },
  {
    href: SECURENOW_REMEDIATION_PATTERNS_PATH,
    label: SECURENOW_NAV_LABELS[SECURENOW_REMEDIATION_PATTERNS_PATH],
    summary: "Review reusable fixes for similar findings.",
  },
  {
    href: SECURENOW_REMEDIATION_INSTANCES_PATH,
    label: SECURENOW_NAV_LABELS[SECURENOW_REMEDIATION_INSTANCES_PATH],
    summary: "See each fix from planned to verified. SecureNow records the plan and the later collection. It does not change Azure.",
  },
];

/** Findings home section — full queue only; assigned-to-me is on the Your work summary. */
export const SECURENOW_FINDINGS_HOME_ROWS: readonly SecureNowHomeDestinationRow[] = [
  {
    href: SECURENOW_FINDINGS_PATH,
    label: SECURENOW_NAV_LABELS[SECURENOW_FINDINGS_PATH],
    summary: "Review every open finding, with severity and owner.",
  },
];

export const SECURENOW_REMEDIATION_HOME_ROWS: readonly SecureNowHomeDestinationRow[] =
  SECURENOW_SECURITY_HOME_ROWS.slice(1);
