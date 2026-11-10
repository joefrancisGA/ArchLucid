import { SECURENOW_REMEDIATION_INSTANCES_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { SECURENOW_REMEDIATION_FACTORY_PATH } from "@/lib/governance/governance-route-paths";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { SECURENOW_INVESTIGATION_EFFORT_PATH } from "@/lib/product-line/securenow-investigation-effort-copy";
import { securenowInternalDocHref } from "@/lib/product-line/securenow-internal-doc-href";

export const SECURENOW_PILOT_DECISION_EXTEND_ROI_LEAD =
  "Extend keeps bounded scope open. Use the synthetic ROI worksheet for sponsor rehearsal — not tenant ROI." as const;

export const SECURENOW_PILOT_DECISION_EXTEND_ROI_LINK_LABEL = "Open investigation effort worksheet" as const;

export const SECURENOW_PILOT_DECISION_EXTEND_ROI_HREF = SECURENOW_INVESTIGATION_EFFORT_PATH;

export const SECURENOW_PILOT_DECISION_HEADING = "Pilot decision preparation" as const;

export const SECURENOW_PILOT_DECISION_LEAD =
  "Internal operator preparation for a human sponsor disposition. SecureNow beta remains NO_GO." as const;

export const SECURENOW_PILOT_DECISION_STEPS: readonly string[] = [
  "Confirm the sponsor, technical operator, decision owner, authorized scope and review question.",
  "Bring the reviewed evidence packet, limitations, unresolved paths and verification status.",
  "Record objections and follow-up owners before selecting an outcome.",
  "Select exactly one: proceed to commercial discussion, extend with bounded scope, or stop.",
] as const;

export const SECURENOW_PILOT_DECISION_OUTCOMES: readonly string[] = [
  "Proceed to commercial discussion is a human decision to discuss separately approved scope; it is not a contract or paid-customer claim.",
  "Extend with bounded scope names the open question, limited scope and next review condition.",
  "Stop preserves the evidence and rationale without treating the evaluation as a verified remediation.",
] as const;

export const SECURENOW_PILOT_DECISION_GUARDRAIL =
  "This page does not authorize billing, clear beta GO, calculate ROI, claim verified remediation, or replace the owner-approved quote and release gates." as const;

export const SECURENOW_DECISION_CYCLE_HEADING = "Decision cycle" as const;

export const SECURENOW_DECISION_CYCLE_LEAD =
  "A person writes the qualify start, the close, and one stall step in the decision cycle log. SecureNow beta remains NO_GO." as const;

/** In-app route for the internal SecureNow decision cycle log (no GitHub blob links in operator UI). */
export const SECURENOW_DECISION_CYCLE_LOG_PATH = securenowInternalDocHref("DECISION_CYCLE_LOG.md");

export type SecureNowDecisionCycleStallStep = {
  readonly label: string;
  readonly href: string;
  readonly note: string;
};

export const SECURENOW_DECISION_CYCLE_STALL_STEPS: readonly SecureNowDecisionCycleStallStep[] = [
  {
    label: "Qualify",
    href: "/administration/securenow-first-hour",
    note: "Confirm the review is worth opening.",
  },
  {
    label: "Scope",
    href: CLOUD_CONNECTIONS_PATH,
    note: "Collection status, including a gap.",
  },
  {
    label: "Review",
    href: SECURENOW_REMEDIATION_FACTORY_PATH,
    note: "One ranked path in Path inspect.",
  },
  {
    label: "Decide change",
    href: "/administration/securenow-pilot-decision#securenow-pilot-decision-outcomes-heading",
    note: "The outcome on this page stays unselected.",
  },
  {
    label: "Verify",
    href: SECURENOW_REMEDIATION_INSTANCES_PATH,
    note: "A later capture. Not verified stays not verified.",
  },
  {
    label: "Close",
    href: SECURENOW_DECISION_CYCLE_LOG_PATH,
    note: "Write times only on a private copy. Leave the source log blank.",
  },
] as const;

export const SECURENOW_DECISION_CYCLE_GUARDRAIL =
  "Leave the outcome blank until a person selects proceed to commercial discussion, extend with bounded scope, or stop on the pilot decision record." as const;
