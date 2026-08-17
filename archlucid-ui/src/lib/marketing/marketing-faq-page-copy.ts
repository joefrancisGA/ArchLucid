export const MARKETING_FAQ_PAGE_TITLE = "Product FAQ" as const;

export const MARKETING_FAQ_PRIMARY_CONTENT_ID = "marketing-faq-primary-content" as const;

export const MARKETING_FAQ_PAGE_INTRO =
  "Evaluation Q&A for architects and sponsors — start with Most asked, then browse by category." as const;
export const MARKETING_FAQ_BACK_TO_OVERVIEW_LABEL = "Back to overview" as const;

export const MARKETING_FAQ_VIEW_PRICING_LABEL = "View pricing" as const;

export const MARKETING_FAQ_SECURITY_TRUST_LINK_LABEL = "Open Security & assurance" as const;

export const MARKETING_FAQ_MOST_ASKED_HEADING = "Most asked" as const;

export const MARKETING_FAQ_MOST_ASKED_INTRO =
  "Start with these three questions — then browse by category." as const;

export const MARKETING_FAQ_DILIGENCE_HEADING = "Procurement and assurance follow-ups" as const;

export const MARKETING_FAQ_DILIGENCE_INTRO =
  "When FAQ answers turn into security questionnaires or contract review, use these diligence entry points before treating marketing copy as evidence." as const;

export const MARKETING_FAQ_START_EVALUATION_CTA = "Start evaluation" as const;

export const MARKETING_FAQ_REQUEST_GUIDED_TRIAL_CTA = "Request guided trial" as const;

/** Public diligence entry for anonymous `/faq` visitors (TB-2333). */
export const MARKETING_FAQ_NDA_REQUEST_HREF = "/trust" as const;

export const MARKETING_FAQ_NDA_REQUEST_LABEL = "Request materials under NDA" as const;

export const MARKETING_FAQ_NDA_REQUEST_DESCRIPTION =
  "Trust Center — public diligence contact paths and NDA-gated pack requests." as const;

export const MARKETING_FAQ_SALES_CONTACT_HREF = "/pricing" as const;

export const MARKETING_FAQ_SALES_CONTACT_LABEL = "Contact sales for procurement pack" as const;

export const MARKETING_FAQ_SALES_CONTACT_DESCRIPTION =
  "Sales-led quotes, references, and enterprise packaging." as const;

export type MarketingFaqDiligenceCta = {
  readonly label: string;
  readonly href: string;
  readonly description: string;
  readonly testId: string;
};

/** Anonymous marketing FAQ diligence ladder — no authenticated administration routes (TB-2333). */
export const MARKETING_FAQ_DILIGENCE_SECONDARY_CTAS: readonly MarketingFaqDiligenceCta[] = [
  {
    label: MARKETING_FAQ_NDA_REQUEST_LABEL,
    href: MARKETING_FAQ_NDA_REQUEST_HREF,
    description: MARKETING_FAQ_NDA_REQUEST_DESCRIPTION,
    testId: "marketing-faq-diligence-nda-request",
  },
  {
    label: MARKETING_FAQ_SALES_CONTACT_LABEL,
    href: MARKETING_FAQ_SALES_CONTACT_HREF,
    description: MARKETING_FAQ_SALES_CONTACT_DESCRIPTION,
    testId: "marketing-faq-diligence-sales-contact",
  },
] as const;
