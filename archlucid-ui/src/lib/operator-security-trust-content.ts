import { resolveInAppDocHref } from "@/lib/in-app-doc-href";

export type OperatorSecurityTrustLinkItem = {
  readonly label: string;
  readonly href: string;
};

/** Procurement-facing materials available without NDA. */
export const OPERATOR_SECURITY_TRUST_AVAILABLE_NOW_ITEMS: ReadonlyArray<OperatorSecurityTrustLinkItem> = [
  { label: "Trust Center", href: "/trust" },
  { label: "Security policies", href: "/trust?focus=security-review" },
  { label: "DPA template", href: resolveInAppDocHref("docs/go-to-market/DPA_TEMPLATE.md") },
  { label: "Subprocessors", href: resolveInAppDocHref("docs/go-to-market/SUBPROCESSORS.md") },
  {
    label: "SOC 2 self-assessment",
    href: resolveInAppDocHref("docs/security/SOC2_SELF_ASSESSMENT_2026.md"),
  },
  { label: "CAIQ / SIG response", href: resolveInAppDocHref("docs/security/CAIQ_LITE_2026.md") },
  {
    label: "Procurement contact",
    href: "mailto:security@archlucid.net?subject=ArchLucid%20security%20review",
  },
];

export const OPERATOR_SECURITY_TRUST_NDA_INTRO =
  "Redacted penetration-test summaries and diligence-only assessment summaries are available under NDA when approved for distribution.";

export const OPERATOR_SECURITY_TRUST_NDA_EMAIL = "security@archlucid.net";

export const OPERATOR_SECURITY_TRUST_ROADMAP_ITEMS: ReadonlyArray<string> = [
  "SOC 2 Type II readiness and audit engagement planning",
  "ISO 27001 alignment documentation",
  "Automated compliance evidence export for procurement packs",
];
