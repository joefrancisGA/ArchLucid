export type CorePilotStepBase = {
  title: string;
  shortBody: string;
  detail?: string;
  primaryHref: string;
  primaryLabel: string;
};

/**
 * Core Pilot path titles and links — shared between the first-review checklist and diagnostics summary on operator home.
 * Tier 1 #3: 90-minute pilot playbook aligned with `docs/runbooks/FIRST_RUN_EVIDENCE_CHECKLIST.md`.
 *
 * {@link CORE_PILOT_STEP_COUNT} must match `CORE_PILOT_STEPS.length` (enforced at module load).
 */
export const CORE_PILOT_STEP_COUNT = 7;

export const EXTRACT_UPLOAD_SETTINGS_PATH = "/settings/extract-upload";

export const CORE_PILOT_STEPS: CorePilotStepBase[] = [
  {
    title: "Start demo review or new request",
    shortBody:
      "Open the sample showcase review or start a new architecture request — capture system identity and constraints in the wizard.",
    detail:
      "Use New review for a guided intake, or open the curated sample package to explore a committed review package before running your own.",
    primaryHref: "/reviews/new",
    primaryLabel: "Start or open review",
  },
  {
    title: "Execute the assessment",
    shortBody: "Run agents until the review reaches ready-to-finalize — watch progress on review detail.",
    detail:
      "The coordinator fills snapshots and assessment steps. If execution fails, capture the correlation id from troubleshooting before retrying.",
    primaryHref: "/reviews?projectId=default",
    primaryLabel: "Open review detail",
  },
  {
    title: "Finalize the review package",
    shortBody: "Commit when ready — this locks the signed review record, findings, and export surfaces.",
    detail:
      "Finalization produces the governed review package. Pre-commit governance may block finalize when blocking findings remain.",
    primaryHref: "/reviews?projectId=default",
    primaryLabel: "Finalize on review detail",
  },
  {
    title: "Upload cloud inventory evidence",
    shortBody: "Optional for document/brief-only reviews — cloud inventory required for cost ROI accuracy.",
    detail:
      "Run the read-only Azure extractor locally, then upload `manifest.json` + `resources.json` from Extract & Upload settings or review detail. If you are using brief, document, or diagram evidence only, skip this step — findings will still run and may have lower confidence on cost claims.",
    primaryHref: EXTRACT_UPLOAD_SETTINGS_PATH,
    primaryLabel: "Upload inventory ZIP",
  },
  {
    title: "Review portfolio ROI",
    shortBody:
      "Open the executive ROI summary on the dashboard — confirm evidence freshness and disposition-aware headline scope.",
    detail:
      "Portfolio ROI uses latest committed review per system. Per-system rows do not sum to the headline — see the proof status strip for scope labels.",
    primaryHref: "/dashboard",
    primaryLabel: "Open ROI dashboard",
  },
  {
    title: "Export run-scoped audit CSV",
    shortBody:
      "From a committed review, export audit events for proof-packet handoff — one click on Artifacts & exports.",
    detail:
      "Run-scoped audit CSV uses GET /v1/audit/export with runId filter. Auditor or Admin role required.",
    primaryHref: "/reviews?projectId=default",
    primaryLabel: "Open Artifacts & exports",
  },
  {
    title: "Review findings and sponsor exports",
    shortBody:
      "Read governed findings, download sponsor artifacts, and share the proof packet with stakeholders.",
    detail:
      "Open the signed review record summary, findings table, and board-pack or markdown exports when your internal review is complete.",
    primaryHref: "/reviews?projectId=default",
    primaryLabel: "Inspect review package",
  },
];

if (CORE_PILOT_STEPS.length !== CORE_PILOT_STEP_COUNT) {
  throw new Error(
    `CORE_PILOT_STEP_COUNT (${CORE_PILOT_STEP_COUNT}) must match CORE_PILOT_STEPS.length (${CORE_PILOT_STEPS.length}).`,
  );
}
