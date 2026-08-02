import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";
import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive-dashboard-route";

/** Repo-relative path for the printable first-run evidence checklist (Tier 1 #3 alignment source). */
export const FIRST_RUN_EVIDENCE_CHECKLIST_DOC_PATH = "docs/runbooks/FIRST_RUN_EVIDENCE_CHECKLIST.md";

/** Admin-only SE/ops printable checklist (`contentKind: internal-runbook`). */
export const FIRST_REVIEW_90MIN_HELP_HREF = "/help/first-review";

/** Buyer-facing guided first-review help — preferred over the SE checklist on operator home. */
export const BUYER_FIRST_REVIEW_HELP_HREF = FIRST_ARCHITECTURE_REVIEW_HELP_PATH;

/**
 * Routes the home checklist must link to — mirrors buyer steps aligned with
 * {@link FIRST_RUN_EVIDENCE_CHECKLIST_DOC_PATH} (upload ZIP, ROI, audit proof).
 */
export const FIRST_REVIEW_90MIN_REQUIRED_ROUTES = [
  "/reviews/new",
  "/reviews",
  "/settings/extract-upload",
  EXECUTIVE_DASHBOARD_HREF,
] as const;

/** Keyword fragments from FIRST_RUN_EVIDENCE_CHECKLIST.md that the UI playbook must cover. */
export const FIRST_REVIEW_90MIN_CHECKLIST_KEYWORDS = [
  "cloud inventory",
  "finalize",
  "export",
  "roi",
  "audit",
] as const;
