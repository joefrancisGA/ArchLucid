import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const ARCHITECTURE_RISK_REGISTER_PAGE_TITLE = OPERATOR_NAV_LINK_LABELS.findings;

export const ARCHITECTURE_RISK_REGISTER_PAGE_SUBTITLE =
  "Track architecture risks created from findings, waivers, exceptions, and approval decisions for this review.";

export const ARCHITECTURE_RISK_REGISTER_GOVERNANCE_INTRO =
  "Track architecture risks created from accepted findings, waivers, exceptions, and approval decisions. Each risk should remain traceable to the review, evidence, policy rule, and finalized review record that produced it. Use this register to assign owners, monitor aging risks, review exceptions before expiry, and prepare audit evidence.";

export const ARCHITECTURE_RISK_REGISTER_EMPTY_TITLE = "No risks recorded for this review";

export const ARCHITECTURE_RISK_REGISTER_EMPTY_BODY =
  "Risks appear here when accepted findings, waivers, exceptions, or approval decisions create follow-up risk items.";

export const ARCHITECTURE_RISK_REGISTER_CONTAINS_COPY =
  "Each row represents a tracked architecture risk. A risk should identify the source finding or decision, owner, severity, resolve status, linked evidence, exception status, and review history. The record should be traceable back to the finalized review that created it.";

export const ARCHITECTURE_RISK_REGISTER_POLICY_PACKS_HREF = GOVERNANCE_POLICY_PACKS_PATH;

export const ARCHITECTURE_RISK_REGISTER_GLOSSARY = [
  {
    term: "Architecture review",
    definition:
      "A finalized review with findings, evidence, and a finalized review record produced through architecture review analysis.",
  },
  {
    term: "Finding",
    definition:
      "A policy or architecture issue surfaced during review that can be accepted, waived, or remediated through governance.",
  },
  {
    term: "Risk",
    definition:
      "An owned architecture risk created when a finding or approval decision requires ongoing monitoring or follow-up.",
  },
  {
    term: "Risk exception",
    definition:
      "A time-bound policy exception for an accepted risk, with owner, rationale, and expiry tracked for audit readiness.",
  },
  {
    term: "Approval decision",
    definition:
      "A recorded approval, rejection, or monitoring disposition tied to a finalized review and evidence trail.",
  },
  {
    term: "Evidence trail",
    definition:
      "The linked inputs, policy rules, findings, and audit events that explain why a risk exists.",
  },
  {
    term: "Finalized review record",
    definition:
      "The immutable finalized record for a finalized review that anchors register traceability.",
  },
  {
    term: "Audit trail",
    definition:
      "The append-only log of approval actions, dispositions, and ownership changes in the workspace.",
  },
] as const;

/** Shown when a finding has no recorded disposition yet, so the cell never repeats the Status column. */
export const GOVERNANCE_QUEUE_DISPOSITION_NONE_LABEL = "Not recorded";
