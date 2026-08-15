export const COMPLIANCE_JOURNEY_PAGE_TITLE = "Compliance journey" as const;

export const COMPLIANCE_JOURNEY_PAGE_LEAD =
  "ArchLucid is not SOC 2 attested today. We publish self-assessment material, questionnaires, and engineering controls so buyers can diligence the product without mistaking roadmap for certification.";

export const COMPLIANCE_JOURNEY_HERO_ORIENTATION =
  "Posture orientation only — use Trust Center downloads for artifacts that exist today." as const;

export const COMPLIANCE_JOURNEY_LAST_REVIEWED_LABEL = "2026-08-15" as const;

export const COMPLIANCE_JOURNEY_PRIMARY_TRUST_CENTER_CTA_LABEL = "Open Trust Center" as const;

export const COMPLIANCE_JOURNEY_VERIFY_CONFIRMATION =
  "Before procurement submission, confirm artifact versions and download hashes on the Trust Center match your diligence checklist.";

export type ComplianceJourneyStage = {
  readonly id: string;
  readonly title: string;
  readonly intro: string;
};

/** Short staged journey headings for `/compliance-journey` (TB-1485 / TB-1487). */
export const COMPLIANCE_JOURNEY_STAGES: readonly ComplianceJourneyStage[] = [
  {
    id: "where-we-are",
    title: "Where we are today",
    intro:
      "We document honest posture, engineering controls, and what buyers can verify today. Start with Assurance status for the public ladder, then open the Trust Center for consolidated downloads.",
  },
  {
    id: "what-we-publish",
    title: "What we publish now",
    intro:
      "Start on the Trust Center for consolidated posture, then use anonymous procurement downloads when you need CAIQ/SIG pre-fills or the evidence pack ZIP.",
  },
  {
    id: "how-to-diligence",
    title: "How to diligence",
    intro:
      "Use in-product help topics for rendered questionnaire responses, contractual templates, and the compliance matrix when downloads are not enough.",
  },
] as const;
