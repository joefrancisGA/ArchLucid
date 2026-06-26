/** Repo-relative path for the printable first-run evidence checklist (Tier 1 #3 alignment source). */
export const FIRST_RUN_EVIDENCE_CHECKLIST_DOC_PATH = "docs/runbooks/FIRST_RUN_EVIDENCE_CHECKLIST.md";

/** In-app help route for the 90-minute first-review playbook. */
export const FIRST_REVIEW_90MIN_HELP_HREF = "/help/first-review";

/**
 * Routes the home checklist must link to — mirrors buyer steps in
 * {@link FIRST_RUN_EVIDENCE_CHECKLIST_DOC_PATH} (upload ZIP, ROI, audit proof).
 */
export const FIRST_REVIEW_90MIN_REQUIRED_ROUTES = [
  "/reviews/new",
  "/reviews",
  "/settings/extract-upload",
  "/dashboard",
] as const;

/** Keyword fragments from FIRST_RUN_EVIDENCE_CHECKLIST.md that the UI playbook must cover. */
export const FIRST_REVIEW_90MIN_CHECKLIST_KEYWORDS = [
  "extractor zip",
  "finalize",
  "export",
  "roi",
  "audit",
] as const;
