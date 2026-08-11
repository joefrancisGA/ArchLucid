import {
  SEE_IT_MARKETING_PDF_DOWNLOAD_FILENAME,
  SEE_IT_MARKETING_PDF_HREF,
  SEE_IT_PAGE_TITLE,
} from "@/lib/see-it-page-copy";

/** Marketing why-pack PDF on `/why` — same asset as `/see-it`, not a governed evidence export (TB-1305). */
export const WHY_MARKETING_PDF_HREF = SEE_IT_MARKETING_PDF_HREF;

export const WHY_MARKETING_PDF_DOWNLOAD_FILENAME = SEE_IT_MARKETING_PDF_DOWNLOAD_FILENAME;

export const WHY_MARKETING_PDF_DOWNLOAD_LABEL = "Download differentiation overview (PDF)";

export const WHY_MARKETING_PDF_SECTION_TITLE = "Differentiation overview (PDF)";

export const WHY_MARKETING_PDF_SECTION_INTRO_BEFORE_LINK =
  "Download a single PDF that bundles the same read-only sample output as the ";

export const WHY_MARKETING_PDF_SECTION_INTRO_AFTER_LINK =
  " (review excerpt, explanation, citations, timeline) plus the citation-backed differentiation narrative table (five detailed rows with citations — not the symbol-only front-door grid below). If the download is not available in your environment, use the contact path on the getting started page.";

export const WHY_MARKET_LANDSCAPE_CITATION_NOTE =
  "Summarized wording only — citations and benchmark detail are included in the marketing overview PDF linked from this page.";

export const WHY_BRAND_CATEGORY_DOWNLOAD_NOTE =
  "The downloadable differentiation overview carries the citation-backed drill-down for diligence teams who need paperwork parity.";

export const WHY_CLOSING_PRIMARY_CTA_LABEL = SEE_IT_PAGE_TITLE;

export const WHY_CLOSING_PRIMARY_CTA_HREF = "/see-it" as const;

/** TB-1301: one supporting sentence above the fold — long differentiation detail lives below. */
export const WHY_HERO_PITCH =
  "Governed architecture reviews with traceable evidence, signed decisions, and audit-ready exports — not another chat box.";

export const WHY_HERO_PRIMARY_CTA_LABEL = WHY_CLOSING_PRIMARY_CTA_LABEL;

export const WHY_HERO_PRIMARY_CTA_HREF = WHY_CLOSING_PRIMARY_CTA_HREF;

export const WHY_CLOSING_SECONDARY_CTA_LABEL = "Start your evaluation";

export const WHY_CLOSING_SECONDARY_CTA_HREF = "/signup" as const;

export const WHY_HERO_SECONDARY_CTA_LABEL = WHY_CLOSING_SECONDARY_CTA_LABEL;

export const WHY_HERO_SECONDARY_CTA_HREF = WHY_CLOSING_SECONDARY_CTA_HREF;
