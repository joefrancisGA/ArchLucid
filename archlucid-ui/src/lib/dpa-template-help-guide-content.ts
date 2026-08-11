import { DPA_TEMPLATE_HELP_PATH } from "@/lib/dpa-template-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const DPA_TEMPLATE_HELP_PAGE_TITLE = "Data Processing Agreement (template)";

export const DPA_TEMPLATE_HELP_PAGE_SUBTITLE =
  "Working negotiation template for counsel — not your countersigned DPA and not legal advice.";

export const DPA_TEMPLATE_HELP_OVERVIEW =
  "Use this page when procurement asks for ArchLucid’s DPA starting point. Download the template PDF for counsel, or open Trust Center for the broader diligence pack. Placeholders in the full template are sample fill-ins, not your live contract parties.";

export const DPA_TEMPLATE_HELP_CLAIM_DISCIPLINE =
  "This is a negotiation template, not a countersigned Data Processing Agreement. Mentions of SOC 2 reports when available do not imply CPA Type I/II attestation.";

export const DPA_TEMPLATE_HELP_PROVENANCE = {
  templateReviewDate: "2026-07-25",
  sourceOfRecordPath: "docs/go-to-market/DPA_TEMPLATE.md",
  noExecutedAgreementNote: "No executed agreement is represented on this page.",
} as const;

export function formatDpaTemplateHelpProvenanceLine(): string {
  return `Source: ${DPA_TEMPLATE_HELP_PROVENANCE.sourceOfRecordPath} · ${DPA_TEMPLATE_HELP_PROVENANCE.noExecutedAgreementNote}`;
}

export const DPA_TEMPLATE_HELP_DOWNLOAD_ACTION = {
  label: "Download DPA template (PDF)",
} as const;

export type DpaTemplateHelpKeyTerm = {
  readonly label: string;
  readonly value: string;
};

/** Material DPA terms quoted from docs/go-to-market/DPA_TEMPLATE.md for first-viewport counsel review. */
export const DPA_TEMPLATE_HELP_KEY_TERMS: readonly DpaTemplateHelpKeyTerm[] = [
  {
    label: "Deletion after termination (§9.2)",
    value:
      "After termination, Processor deletes Customer Data within 90 days except where retention is required by law or documented backup cycles; backups roll off per Processor’s retention schedule.",
  },
  {
    label: "Breach notification (§6.5)",
    value:
      "Processor notifies Controller without undue delay after becoming aware of a personal data breach, in line with applicable law (including 72 hours where GDPR Article 33 applies and Processor is responsible).",
  },
  {
    label: "Sub-processor objection (§6.3)",
    value:
      "Controller may object to a new Sub-processor in accordance with the notification commitment in Subprocessors.",
  },
  {
    label: "International transfers (§7)",
    value:
      "Processor uses mechanisms appropriate to the transfer (e.g., Standard Contractual Clauses or equivalent), aligned with Microsoft’s offerings and Controller’s Azure / Entra configuration.",
  },
  {
    label: "Cross-tenant patterns (§10.1, §10.3)",
    value:
      "Cross-tenant pattern participation is OFF unless Controller explicitly enables it; minimum cohort size (k >= 5 distinct contributing tenants per published bucket, unless a stricter value is agreed in writing) before showing any pattern to other tenants.",
  },
  {
    label: "Audit artifacts (§6.7)",
    value:
      "Processor makes available SOC 2 reports when available and reasonable information necessary to demonstrate compliance.",
  },
] as const;

/** Unresolved negotiation variables from DPA_TEMPLATE.md §10A. */
export const DPA_TEMPLATE_HELP_OPEN_VARIABLES: readonly string[] = [
  "<<Controller legal name and address>> / <<Processor legal name and address>> in the parties table.",
  "<<YYYY-MM-DD>> (effective date) and <<Subscription or order form ID>> (reference).",
  "Transfer-mechanism specifics where regional law requires additional annex language.",
  "Any stricter customer-requested cohort threshold above k >= 5.",
] as const;

export const DPA_TEMPLATE_HELP_KEY_TERMS_HEADING = "Key template terms";

export const DPA_TEMPLATE_HELP_OPEN_VARIABLES_HEADING = "Unresolved negotiation variables (§10A)";

export const DPA_TEMPLATE_HELP_FULL_DISCLOSURE_CAVEAT =
  "Placeholders such as controller name and effective date are sample fill-ins for counsel — not your executed parties.";

export const DPA_TEMPLATE_HELP_ORIENTATION = [
  "Download the DPA template PDF for counsel or open Trust Center for the broader diligence pack.",
  "Review Subprocessors and data-handling help before attaching schedules.",
  "Expand the full template below when counsel needs clause-level text, or download the PDF for offline review.",
] as const;

export const DPA_TEMPLATE_HELP_PRIMARY_ACTIONS = {
  openTrustCenter: {
    label: "Open Trust Center",
    href: "/trust",
  },
  openSubprocessors: {
    label: "Subprocessors",
    href: inAppHelpHref("subprocessors"),
  },
  openProcurement: {
    label: "Procurement FAQ",
    href: inAppHelpHref("procurement"),
  },
} as const;

export const DPA_TEMPLATE_HELP_CANONICAL_PATH = DPA_TEMPLATE_HELP_PATH;
