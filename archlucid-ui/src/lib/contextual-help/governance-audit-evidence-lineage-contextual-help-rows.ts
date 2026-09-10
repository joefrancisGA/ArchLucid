/** Audit evidence lineage lookup and control chain of custody (SH-09). */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import {
  AUDIT_EVIDENCE_CONTROL_LINEAGE_PAGE_LEAD,
  AUDIT_EVIDENCE_PAGE_LEAD,
} from "@/lib/audit-evidence-page-copy";
import { AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH } from "@/lib/audit-evidence-lineage-route";
import {
  GOVERNANCE_POLICY_PACKS_PATH,
} from "@/lib/governance/governance-route-paths";
import {
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";

const GOVERNANCE_AUDIT_EVIDENCE_CONTROL_LINEAGE_PREFIX =
  `${AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH}/` as const;

const GOVERNANCE_AUDIT_EVIDENCE_LINEAGE_LOOKUP_CONTEXTUAL_HELP = {
  whatIsThisPage: `Audit evidence lineage — ${AUDIT_EVIDENCE_PAGE_LEAD}`,
  whatToDoNext:
    "Paste assessment, snapshot, and control IDs or a lineage URL, then open chain of custody — or start from the resource explorer to copy IDs from a hub.",
  whyEmpty:
    "The lookup form is always available; chain-of-custody results appear after valid assessment snapshot IDs are entered.",
  whereToConfigurePrerequisite:
    "You need an assessment snapshot from inventory capture, extract and upload, or a connector integration before lineage resolves.",
  whatToDoNextAction: {
    label: "Open resource explorer",
    href: GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
  },
  whereToConfigureAction: {
    label: "Open policy packs",
    href: GOVERNANCE_POLICY_PACKS_PATH,
  },
  taskSteps: [
    "Paste assessment, snapshot, and control IDs from an export — not an AI summary.",
    "Open chain of custody when IDs are valid, or browse resource inventory to copy linked IDs.",
    "Return to policy packs when assessment scope or ARC-AMPE packs need configuration.",
  ],
} as const;

const GOVERNANCE_AUDIT_EVIDENCE_CONTROL_LINEAGE_CONTEXTUAL_HELP = {
  whatIsThisPage: `Control chain of custody — ${AUDIT_EVIDENCE_CONTROL_LINEAGE_PAGE_LEAD}`,
  whatToDoNext:
    "Follow the deterministic lineage spine for this control, then copy IDs or return to lookup when scope needs changing.",
  whyEmpty:
    "Chain-of-custody rows appear after valid assessment snapshot IDs resolve for this control.",
  whereToConfigurePrerequisite:
    "Confirm the assessment snapshot exists from inventory capture, extract and upload, or connector integration.",
  whatToDoNextAction: {
    label: "Back to audit evidence lookup",
    href: AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH,
  },
  whereToConfigureAction: {
    label: "Open resource explorer",
    href: GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
  },
  taskSteps: [
    "Read the deterministic chain from control through requirements, evaluation, and collected evidence.",
    "Copy route identifiers when ITSM or export bundles need the same lineage URL.",
    "Return to lookup or open a resource hub when IDs or scope need correction.",
  ],
} as const;

export const GOVERNANCE_AUDIT_EVIDENCE_LINEAGE_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: GOVERNANCE_AUDIT_EVIDENCE_CONTROL_LINEAGE_PREFIX,
    entry: GOVERNANCE_AUDIT_EVIDENCE_CONTROL_LINEAGE_CONTEXTUAL_HELP,
  },
  {
    prefix: AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH,
    entry: GOVERNANCE_AUDIT_EVIDENCE_LINEAGE_LOOKUP_CONTEXTUAL_HELP,
  },
];
