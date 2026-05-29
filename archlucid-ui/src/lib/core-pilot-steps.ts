export type CorePilotStepBase = {
  title: string;
  shortBody: string;
  detail?: string;
  primaryHref: string;
  primaryLabel: string;
};

/**
 * Core Pilot path titles and links — shared between the first-review checklist and diagnostics summary on operator home.
 * No JSX here; `OperatorFirstRunWorkflowPanel` adds rich optional `secondary` for specific steps locally.
 *
 * {@link CORE_PILOT_STEP_COUNT} must match `CORE_PILOT_STEPS.length` (enforced at module load).
 */
export const CORE_PILOT_STEP_COUNT = 5;

export const EXTRACT_UPLOAD_SETTINGS_PATH = "/settings/extract-upload";

export const CORE_PILOT_STEPS: CorePilotStepBase[] = [
  {
    title: "Upload Azure architecture context",
    shortBody: "Run the read-only extractor script locally, then upload the ZIP for production-faithful reviews.",
    detail:
      "The Extract & Upload settings page walks through script download, local execution, optional CLI validation, and server upload.",
    primaryHref: EXTRACT_UPLOAD_SETTINGS_PATH,
    primaryLabel: "Upload Azure package",
  },
  {
    title: "Create an architecture review request",
    shortBody: "Capture system identity, requirements, and constraints for your first review package.",
    detail:
      "The new-request wizard walks you through system identity, requirements, constraints, and advanced inputs — then submits the assessment and tracks progress in real time.",
    primaryHref: "/reviews/new",
    primaryLabel: "Start new request",
  },
  {
    title: "Track review progress",
    shortBody: "Watch assessment progress in the wizard or open the review from the list when it is ready.",
    detail:
      "The coordinator fills snapshots and assessment steps. You can use the wizard's last step or open review detail anytime.",
    primaryHref: "/reviews?projectId=default",
    primaryLabel: "Open reviews list",
  },
  {
    title: "Finalize the review package",
    shortBody: "On review detail, finalize when the assessment is ready — this locks your review package and unlocks exports.",
    detail:
      "Finalization produces the signed architecture manifest and artifacts. Until then, the manifest summary and artifact table are not available. See docs/OPERATOR_QUICKSTART.md for CLI/API.",
    primaryHref: "/reviews?projectId=default",
    primaryLabel: "Choose review → open detail",
  },
  {
    title: "Review the review package",
    shortBody:
      "After finalization, read the package summary and findings on review detail; download or share artifacts — that bundle is your review package.",
    detail:
      "Open the manifest link from review detail for the full page; use artifact actions for download and in-shell review.",
    primaryHref: "/reviews?projectId=default",
    primaryLabel: "Open a finalized review",
  },
];

if (CORE_PILOT_STEPS.length !== CORE_PILOT_STEP_COUNT) {
  throw new Error(
    `CORE_PILOT_STEP_COUNT (${CORE_PILOT_STEP_COUNT}) must match CORE_PILOT_STEPS.length (${CORE_PILOT_STEPS.length}).`,
  );
}
