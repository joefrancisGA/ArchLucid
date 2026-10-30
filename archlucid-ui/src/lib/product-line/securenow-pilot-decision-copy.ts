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
