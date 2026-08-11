/**
 * Signed review record copy — sections, deliverables, and downloads.
 *
 * Re-exported by `./index.ts`; import from `@/lib/buyer-polish-copy` or `@/lib/buyer-copy`.
 */

export const BUYER_MANIFEST_DELIVERABLES_HEADING = "Deliverables";

export const BUYER_MANIFEST_DELIVERABLE_EXECUTIVE_PDF_TITLE = "Executive PDF";

export const BUYER_MANIFEST_DELIVERABLE_EXECUTIVE_PDF_DESC =
  "Sponsor-ready one-pager with verdict, top risks, and recommended actions.";

export const BUYER_MANIFEST_DELIVERABLE_DOCX_TITLE = "Architecture review export (DOCX)";

export const BUYER_MANIFEST_DELIVERABLE_DOCX_DESC =
  "Full review for architecture board and GRC teams.";

export const BUYER_MANIFEST_DELIVERABLE_ZIP_TITLE = "Review bundle (ZIP)";

export const BUYER_MANIFEST_DELIVERABLE_ZIP_DESC =
  "All signed artifacts, evidence index, and review record in one archive.";

export const BUYER_MANIFEST_DELIVERABLE_MARKDOWN_TITLE = "Decision receipt (Markdown)";

export const BUYER_MANIFEST_DELIVERABLE_MARKDOWN_DESC =
  "Machine-readable record of all decisions in this review.";

export const BUYER_MANIFEST_SUMMARY_LOAD_ERROR_HEADING = "Review record summary could not be loaded.";

export const BUYER_MANIFEST_SUMMARY_MALFORMED_HEADING = "Review record summary response was not usable.";

export const BUYER_MANIFEST_SUMMARY_MISSING_HEADING = "Review record summary missing.";

export const BUYER_SEALED_MANIFEST_TOOLTIP =
  "Finalized signed review record: hash-verified, write-locked record after governance approval — not informal draft text.";

export const BUYER_MANIFEST_BUNDLE_DOWNLOAD_DETAILS_SUMMARY = "Download finalized review";

export const BUYER_MANIFEST_BUNDLE_DOWNLOAD_ZIP_NOTE = "Delivered as a ZIP archive for diligence and archiving.";

/**
 * @deprecated Prefer {@link SIGNED_MANIFEST_LABEL} / `BUYER_SURFACE_VOCABULARY.signedReviewRecord`.
 * Kept so older imports resolve to the canonical package noun (not a Decision register row).
 */
export const BUYER_SIGNED_DECISION_RECORD_LABEL = "Signed review record";

export const BUYER_MANIFEST_SECTION_DECISION = "Decision";

/** Run detail manifest summary definition list — buyer-polished reviewer shell. */
export const BUYER_RUN_DETAIL_MANIFEST_DECISIONS_LABEL = "Decisions recorded";

export const BUYER_MANIFEST_SECTION_EVIDENCE = "Evidence";

export const BUYER_MANIFEST_SECTION_DOWNLOADS = "Downloads";

export const BUYER_MANIFEST_SECTION_DILIGENCE = "Diligence";

export const BUYER_EXECUTIVE_BRIEFING_PACKAGE_LABEL = "Executive briefing export";

export const BUYER_TECHNICAL_APPENDIX_LABEL = "Technical appendix";

export const BUYER_DOWNLOAD_REVIEW_RECORD_JSON = "Download review record (JSON)";

export const BUYER_COPY_REVIEW_RECORD_JSON = "Copy review record JSON";

export const BUYER_VIEW_SIGNED_RECORD_CTA = "View signed record";

export const BUYER_OPEN_SIGNED_RECORD_CTA = "Open signed record";

export const BUYER_VIEW_SIGNED_REVIEW_RECORD_CTA = "View signed review record";

export const BUYER_REVIEW_DETAIL_EVIDENCE_BASIS_LINE =
  "Blocking issues: 0 · Evidence basis: signed review record, evidence trail, audit trail";

export const BUYER_DECISION_KEY_SUMMARY = "Decision key";

export const BUYER_MANIFEST_HEADLINE_SUFFIX = "architecture review";

export const BUYER_MANIFEST_AUTHORITY_SUMMARY =
  "This signed review record is the authoritative record for this review — decisions, findings, and downloadable deliverables.";

export const BUYER_MANIFEST_TOP_RISK_CTA = "View top risk and evidence";

export const BUYER_MANIFEST_NO_DELIVERABLES_YET = "No deliverables listed yet.";

export const BUYER_MANIFEST_DOWNLOAD_PREPARING = "Download is being prepared when your workspace publishes a bundle for this review.";

export const BUYER_MANIFEST_DOWNLOAD_REVIEW_PACKAGE_ZIP = "Download review (ZIP)";
