import { DPA_TEMPLATE_HELP_PATH } from "@/lib/dpa-template-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const DPA_TEMPLATE_HELP_PAGE_TITLE = "Data Processing Agreement (template)";

export const DPA_TEMPLATE_HELP_PAGE_SUBTITLE =
  "Working negotiation template for counsel — not your countersigned DPA and not legal advice.";

export const DPA_TEMPLATE_HELP_OVERVIEW =
  "Use this page when procurement asks for ArchLucid’s DPA starting point. Request or download the pack from Trust Center, then have qualified legal counsel adapt the template before execution. Placeholders in the full template are sample fill-ins, not your live contract parties.";

export const DPA_TEMPLATE_HELP_CLAIM_DISCIPLINE =
  "This is a negotiation template, not a countersigned Data Processing Agreement. Mentions of SOC 2 reports when available do not imply CPA Type I/II attestation.";

export const DPA_TEMPLATE_HELP_ORIENTATION = [
  "Open Trust Center for the diligence pack path and assurance artifacts.",
  "Review Subprocessors and data-handling help before attaching schedules.",
  "Expand the full template only after counsel is ready to negotiate placeholders.",
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

export type DpaTemplateHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Sponsor-safe diligence Sources — no self-href to this topic. */
export const DPA_TEMPLATE_HELP_SOURCES: readonly DpaTemplateHelpSourceLink[] = [
  { label: "Trust Center", href: "/trust" },
  { label: "Security and trust", href: inAppHelpHref("security-trust") },
  { label: "Subprocessors", href: inAppHelpHref("subprocessors") },
  { label: "Data handling", href: inAppHelpHref("data-handling") },
  {
    label: "Data handling and tenant isolation",
    href: inAppHelpHref("data-handling"),
  },
  { label: "Procurement FAQ", href: inAppHelpHref("procurement") },
] as const;

export const DPA_TEMPLATE_HELP_CANONICAL_PATH = DPA_TEMPLATE_HELP_PATH;
