import {
  SEE_IT_MARKETING_PDF_DOWNLOAD_FILENAME,
  SEE_IT_MARKETING_PDF_HREF,
  SEE_IT_PAGE_TITLE,
} from "@/lib/see-it-page-copy";
import { CANONICAL_ANONYMOUS_PROOF_HREF } from "@/lib/showcase-static-demo";

/** Marketing why-pack PDF on `/why` — same asset as `/see-it`, not a governed evidence export (TB-1305). */
export const WHY_MARKETING_PDF_HREF = SEE_IT_MARKETING_PDF_HREF;

export const WHY_MARKETING_PDF_DOWNLOAD_FILENAME = SEE_IT_MARKETING_PDF_DOWNLOAD_FILENAME;

export const WHY_MARKETING_PDF_DOWNLOAD_LABEL = "Download differentiation overview (PDF)";

export const WHY_MARKETING_PDF_SECTION_TITLE = "Differentiation overview (PDF)";

/** @deprecated PDF section demoted to quiet procurement link on /why — kept for drift guards. */
export const WHY_MARKETING_PDF_SECTION_INTRO_BEFORE_LINK =
  "Download a single PDF that bundles the same read-only sample output as the ";

/** @deprecated PDF section demoted to quiet procurement link on /why — kept for drift guards. */
export const WHY_MARKETING_PDF_SECTION_INTRO_AFTER_LINK =
  " page (review excerpt, explanation, citations, timeline) plus the citation-backed differentiation narrative table (five detailed rows with citations — not the symbol-only front-door grid below). If the download is not available in your environment, use the contact path on the getting started page.";

export const WHY_PROCUREMENT_PDF_QUIET_PREFIX = "Need procurement detail? ";

export const WHY_PROCUREMENT_PDF_QUIET_LINK_LABEL = "Download the complete differentiation brief";

export const WHY_HARD_COMPARISON_DISCLOSURE_LABEL = "See detailed capability comparison";

export const WHY_MARKET_LANDSCAPE_CITATION_NOTE =
  "Summarized wording only — citations and benchmark detail are included in the marketing overview PDF linked from this page.";

/** TB-1303: collapsed-by-default adjacent-tooling landscape table. */
export const WHY_MARKET_LANDSCAPE_DISCLOSURE_LABEL = "More comparisons: adjacent tooling landscape";

export const WHY_BRAND_CATEGORY_DOWNLOAD_NOTE =
  "The downloadable differentiation overview carries the citation-backed drill-down for diligence teams who need paperwork parity.";

/** Compact differentiation context — long-form comparisons live below the proof chain. */
export const WHY_BRAND_CATEGORY_INTRO =
  "Finalized architecture reviews whose findings, signed decisions, and exports share one traceable evidence trail — not disposable chat output.";

export const WHY_CLOSING_HEADING = "See what a finalized architecture decision actually looks like";

export const WHY_CLOSING_LEAD =
  "Inspect the evidence, findings, approvals, audit trail, and final export from a completed review.";

export const WHY_CLOSING_PRIMARY_CTA_LABEL = SEE_IT_PAGE_TITLE;

export const WHY_CLOSING_PRIMARY_CTA_HREF = "/see-it" as const;

/** TB-1301: one supporting sentence above the fold — long differentiation detail lives below. */
export const WHY_HERO_PITCH =
  "Finalized architecture reviews with traceable evidence, signed decisions, and audit-ready exports — not another chat box.";

export const WHY_HERO_PRIMARY_CTA_LABEL = WHY_CLOSING_PRIMARY_CTA_LABEL;

export const WHY_HERO_PRIMARY_CTA_HREF = WHY_CLOSING_PRIMARY_CTA_HREF;

export const WHY_CLOSING_SECONDARY_CTA_LABEL = "Start your evaluation";

export const WHY_CLOSING_SECONDARY_CTA_HREF = "/signup" as const;

export const WHY_HERO_SECONDARY_CTA_LABEL = WHY_CLOSING_SECONDARY_CTA_LABEL;

export const WHY_HERO_SECONDARY_CTA_HREF = WHY_CLOSING_SECONDARY_CTA_HREF;

/** Operator Home screenshot for the /why hero proof card (TB-1671; refreshed TB-2301). */
export const WHY_HERO_PRODUCT_SCREENSHOT_FILENAME =
  "why-hero-operator-home-2026-08-19.png" as const;

export const WHY_HERO_PRODUCT_SCREENSHOT_SRC =
  `/marketing/why/${WHY_HERO_PRODUCT_SCREENSHOT_FILENAME}` as const;

export const WHY_HERO_PRODUCT_SCREENSHOT_ALT =
  "ArchLucid operator Home showing Recent reviews and a Claims Intake sample review card";

export const WHY_HERO_PRODUCT_SCREENSHOT_CAPTION =
  "Claims Intake Demo workspace — sample review with findings, approvals, and evidence trail (fabricated demo data)";

/**
 * TB-1302 / M-107 Option A: canonical anonymous proof ladder — Claims-static primary;
 * Contoso `/demo/preview` is secondary and explicitly labeled.
 */
export const WHY_PROOF_LADDER_PRIMARY_HREF = WHY_HERO_PRIMARY_CTA_HREF;

export const WHY_PROOF_LADDER_PRIMARY_LABEL = SEE_IT_PAGE_TITLE;

export const WHY_PROOF_LADDER_SAMPLE_HREF = CANONICAL_ANONYMOUS_PROOF_HREF;

export const WHY_PROOF_LADDER_SAMPLE_LABEL = "Healthcare Claims sample review";

export const WHY_PROOF_LADDER_WALKTHROUGH_HREF = "/get-started" as const;

export const WHY_PROOF_LADDER_WALKTHROUGH_LABEL = "Ready to start your evaluation?";

export const WHY_RETAIL_SAMPLE_PREVIEW_HREF = CANONICAL_ANONYMOUS_PROOF_HREF;

/** @deprecated Use {@link WHY_RETAIL_SAMPLE_PREVIEW_HREF} — kept for stable test imports. */
export const WHY_CONTOSO_PREVIEW_HREF = WHY_RETAIL_SAMPLE_PREVIEW_HREF;

export const WHY_RETAIL_SAMPLE_PREVIEW_LABEL = "Enterprise retail sample (longer preview)";

/** @deprecated Use {@link WHY_RETAIL_SAMPLE_PREVIEW_LABEL} — kept for stable test imports. */
export const WHY_CONTOSO_PREVIEW_LABEL = WHY_RETAIL_SAMPLE_PREVIEW_LABEL;
