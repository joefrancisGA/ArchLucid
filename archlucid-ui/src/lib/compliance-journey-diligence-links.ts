import { resolveInAppDocHref } from "@/lib/in-app-doc-href";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { TRUST_CENTER_EVIDENCE_PACK_ZIP_HREF } from "@/lib/trust-center-public-assurance";

export const COMPLIANCE_JOURNEY_CAIQ_SIG_PREFILL_HELP_LABEL =
  "CAIQ / SIG questionnaire pre-fill drafts" as const;

export const COMPLIANCE_JOURNEY_TRUST_PUBLIC_DOWNLOADS_HREF = "/trust#trust-public-downloads" as const;

export type ComplianceJourneyLinkDestination =
  | "trust-center-page"
  | "trust-center-download"
  | "in-product-help"
  | "template";

export type ComplianceJourneyDiligenceLink = {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly destination: ComplianceJourneyLinkDestination;
};

export const COMPLIANCE_JOURNEY_DESTINATION_LABELS: Readonly<
  Record<ComplianceJourneyLinkDestination, string>
> = {
  "trust-center-page": "Trust Center page",
  "trust-center-download": "Trust Center download",
  "in-product-help": "in-product help",
  template: "template in product help",
};

export type ComplianceJourneyDiligenceSection = {
  readonly id: string;
  readonly lead: string;
  readonly links: readonly ComplianceJourneyDiligenceLink[];
};

/** Buyer-facing diligence links for `/compliance-journey` with explicit destination labels (TB-1486). */
export const COMPLIANCE_JOURNEY_DILIGENCE_SECTIONS: readonly ComplianceJourneyDiligenceSection[] = [
  {
    id: "posture",
    lead: "Start on the Trust Center for consolidated posture and anonymous procurement downloads.",
    links: [
      {
        id: "trust-center",
        label: "Trust Center",
        href: "/trust",
        destination: "trust-center-page",
      },
      {
        id: "public-downloads",
        label: "Public assurance downloads",
        href: COMPLIANCE_JOURNEY_TRUST_PUBLIC_DOWNLOADS_HREF,
        destination: "trust-center-download",
      },
      {
        id: "evidence-pack-zip",
        label: "Procurement evidence pack (ZIP)",
        href: TRUST_CENTER_EVIDENCE_PACK_ZIP_HREF,
        destination: "trust-center-download",
      },
    ],
  },
  {
    id: "questionnaires",
    lead:
      "Questionnaire pre-fills ship in the Trust Center evidence pack. Use in-product help when you need the rendered CAIQ / SIG topics without downloading the ZIP.",
    links: [
      {
        id: "caiq-sig-trust",
        label: "CAIQ Lite and SIG Core (in evidence pack)",
        href: COMPLIANCE_JOURNEY_TRUST_PUBLIC_DOWNLOADS_HREF,
        destination: "trust-center-download",
      },
      {
        id: "caiq-sig-help",
        label: COMPLIANCE_JOURNEY_CAIQ_SIG_PREFILL_HELP_LABEL,
        href: inAppHelpHref("caiq-sig-response"),
        destination: "in-product-help",
      },
    ],
  },
  {
    id: "contracts",
    lead: "Contractual and data-handling templates are also included in the evidence pack; help topics explain each artifact.",
    links: [
      {
        id: "dpa-template",
        label: "DPA template",
        href: inAppHelpHref("dpa-template"),
        destination: "template",
      },
      {
        id: "subprocessors",
        label: "Subprocessor list",
        href: inAppHelpHref("subprocessors"),
        destination: "in-product-help",
      },
      {
        id: "compliance-matrix",
        label: "Compliance matrix",
        href: resolveInAppDocHref("docs/security/COMPLIANCE_MATRIX.md"),
        destination: "in-product-help",
      },
      {
        id: "trust-center-pack-help",
        label: "Trust Center pack overview",
        href: resolveInAppDocHref("docs/go-to-market/trust-center.md"),
        destination: "in-product-help",
      },
    ],
  },
] as const;

export function complianceJourneyLinkAccessibleName(link: ComplianceJourneyDiligenceLink): string {
  return `${link.label} (${COMPLIANCE_JOURNEY_DESTINATION_LABELS[link.destination]})`;
}
