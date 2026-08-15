import { TRUST_CENTER_EVIDENCE_PACK_ZIP_HREF } from "@/lib/trust-center-public-assurance";

export const TRUST_CENTER_SECURITY_EMAIL = "security@archlucid.net" as const;

export const TRUST_CENTER_PUBLIC_EVIDENCE_VERSION = "2026.05" as const;

export type TrustAssuranceClassification =
  | "public"
  | "nda"
  | "on-request"
  | "customer-specific"
  | "planned";

export type TrustAssuranceClassificationLabel = {
  readonly id: TrustAssuranceClassification;
  readonly label: string;
};

export const TRUST_ASSURANCE_CLASSIFICATIONS: Readonly<Record<TrustAssuranceClassification, string>> = {
  public: "Public",
  "nda": "Available under NDA",
  "on-request": "Available on request",
  "customer-specific": "Customer-specific",
  planned: "Planned",
};

export type TrustAssuranceGlancePanel = {
  readonly id: string;
  readonly title: string;
  readonly classification: TrustAssuranceClassification;
  readonly summary: string;
  readonly bullets: readonly string[];
  readonly actionLabel?: string;
  readonly actionHref?: string;
};

export type TrustContentCard = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly classification: TrustAssuranceClassification;
  readonly actionLabel: string;
  readonly actionHref: string;
  readonly sectionId?: string;
};

export type TrustPlannedAssuranceMilestone = {
  readonly id: string;
  readonly activity: string;
  readonly status: string;
  readonly timing: string;
  readonly deliverable: string;
  readonly availability: string;
  readonly classification: TrustAssuranceClassification;
};

export const TRUST_CENTER_HERO = {
  title: "Trust Center",
  subtitle: "Review ArchLucid’s current security posture, public assurance materials, and enterprise diligence process.",
  intro:
    "Use this page for public evidence downloads and procurement posture. For a one-page assurance ladder by maturity tier, see Assurance status.",
} as const;

export const TRUST_ASSURANCE_GLANCE_PANELS: readonly TrustAssuranceGlancePanel[] = [
  {
    id: "available-now",
    title: "Available now",
    classification: "public",
    summary: "Public-safe materials suitable for initial procurement review.",
    bullets: [
      "Architecture, operations, and security documentation packs",
      "Questionnaire-oriented summaries with immutable change logging",
      "Procurement artifacts mapped to common security questionnaires",
    ],
    actionLabel: "Download evidence pack (ZIP)",
    actionHref: TRUST_CENTER_EVIDENCE_PACK_ZIP_HREF,
  },
  {
    id: "shared-diligence",
    title: "Shared during diligence",
    classification: "nda",
    summary: "Detailed materials shared under confidentiality during active review.",
    bullets: [
      "CAIQ-lite and SIG-oriented questionnaire responses",
      "Subprocessors and tenancy overview on request",
      "Customer-specific evidence bundles when approved",
    ],
    actionLabel: "Assurance status",
    actionHref: "/assurance-status",
  },
  {
    id: "planned",
    title: "Planned assurance activities",
    classification: "planned",
    summary: "Programs in progress without published attestation or third-party reports today.",
    bullets: [
      "SOC 2 readiness and control mapping",
      "Independent penetration testing program",
      "Rolling internal security assessments",
    ],
    actionLabel: "View planned assurance",
    actionHref: "#trust-planned-assurance",
  },
] as const;

export const TRUST_CONTENT_CARDS: readonly TrustContentCard[] = [
  {
    id: "security-posture",
    title: "Security posture summary",
    description:
      "Tenant isolation, scope-filtered APIs, and audit instrumentation for material changes. Control narratives deepen during diligence.",
    classification: "public",
    actionLabel: "Assurance status",
    actionHref: "/assurance-status",
    sectionId: "isolation-section",
  },
  {
    id: "assurance-artifacts",
    title: "Assurance artifacts",
    description:
      "Procurement bundle with questionnaire pre-fills, subprocessors overview, SLA excerpts, and incident-response placeholders.",
    classification: "nda",
    actionLabel: "Request diligence materials",
    actionHref: `mailto:${TRUST_CENTER_SECURITY_EMAIL}`,
  },
  {
    id: "data-handling",
    title: "Data handling and privacy",
    description:
      "Architecture review evidence and governance metadata — not a clinical record system. Production terms are contractual.",
    classification: "public",
    actionLabel: "Privacy policy",
    actionHref: "/privacy",
    sectionId: "data-handling-section",
  },
  {
    id: "procurement-package",
    title: "Procurement questionnaire response package",
    description:
      "Structured answers mapped to ArchLucid’s procurement evidence catalog for security and vendor-risk questionnaires.",
    classification: "on-request",
    actionLabel: "Request diligence materials",
    actionHref: `mailto:${TRUST_CENTER_SECURITY_EMAIL}`,
  },
] as const;

export const TRUST_PLANNED_ASSURANCE_MILESTONES: readonly TrustPlannedAssuranceMilestone[] = [
  {
    id: "soc2",
    activity: "SOC 2 readiness and control mapping",
    status: "In progress",
    timing: "Aligned with buyer procurement calendar when approved",
    deliverable: "Control mapping and readiness materials",
    availability: "Formal attestation only after completion and controlled release",
    classification: "planned",
  },
  {
    id: "pentest",
    activity: "Independent penetration testing",
    status: "Planned",
    timing: "Next assurance cycle when vendor engagement is approved",
    deliverable: "Redacted sponsor report when approved for distribution",
    availability: "Not a published third-party report today",
    classification: "planned",
  },
  {
    id: "internal-assessments",
    activity: "Internal security assessments",
    status: "Ongoing",
    timing: "Rolling cadence",
    deliverable: "Assessment summaries for diligence reviewers",
    availability: "Shared under NDA during active review",
    classification: "nda",
  },
] as const;

export const TRUST_PUBLIC_EVIDENCE_RELEASE = {
  artifactName: "Public evidence summary",
  description:
    "Public-safe excerpt suitable for initial diligence intake and security questionnaires.",
  classification: "public" as const,
  requestSubject: "Public evidence summary request",
} as const;

export const TRUST_SECURITY_CONTACT = {
  title: "Security and diligence contact",
  intro:
    "Contact security for diligence materials, questionnaire coordination, sensitive assurance requests, and security review questions.",
} as const;
