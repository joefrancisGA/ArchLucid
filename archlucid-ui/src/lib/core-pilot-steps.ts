import { CLOUD_NEUTRAL_PRIMARY_COPY } from "@/lib/cloud-neutral-primary-copy";
import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive/executive-dashboard-route";

export type CorePilotStepBase = {
  title: string;
  shortBody: string;
  detail?: string;
  primaryHref: string;
  primaryLabel: string;
};

/**
 * Core Pilot path titles and links — shared between the first-review checklist and diagnostics summary on operator home.
 * Tier 1 #3: 90-minute pilot playbook aligned with printable checklist in `docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md`.
 *
 * {@link CORE_PILOT_STEP_COUNT} must match `CORE_PILOT_STEPS.length` (enforced at module load).
 */
export const CORE_PILOT_STEP_COUNT = 7;

export const EXTRACT_UPLOAD_SETTINGS_PATH = "/administration/extract-upload";

export const CORE_PILOT_STEPS: CorePilotStepBase[] = [
  {
    title: "Start demo review or new request",
    shortBody:
      "Open the sample showcase review or start a new architecture request — capture system identity and constraints in the wizard.",
    detail:
      "Use New architecture review for guided intake, or open the curated sample review to explore a finalized architecture review before running your own. Create architecture drafts separately when you want to save intent without starting a review.",
    primaryHref: "/architecture/reviews/new",
    primaryLabel: "Start or open review",
  },
  {
    title: "Execute the review",
    shortBody: "Execute the review until it reaches ready-to-finalize — watch progress on review detail.",
    detail:
      "The assessment fills architecture structure and findings. If execution fails, capture the correlation id from troubleshooting before retrying.",
    primaryHref: "/architecture/reviews",
    primaryLabel: "Open review detail",
  },
  {
    title: "Finalize the review",
    shortBody: "Finalize when ready — this locks the signed review record, findings, and export surfaces.",
    detail:
      "Finalization produces the governed architecture review. Governance policy may block finalize when blocking findings remain.",
    primaryHref: "/architecture/reviews",
    primaryLabel: "Finalize on review detail",
  },
  {
    title: "Upload cloud inventory evidence",
    shortBody: "Optional for document/brief-only reviews — cloud inventory required for cost ROI accuracy.",
    detail: CLOUD_NEUTRAL_PRIMARY_COPY.corePilotInventoryStepDetail,
    primaryHref: EXTRACT_UPLOAD_SETTINGS_PATH,
    primaryLabel: "Upload inventory ZIP",
  },
  {
    title: "Review portfolio ROI",
    shortBody:
      "Open the executive ROI summary on the dashboard — confirm evidence freshness and disposition-aware headline scope.",
    detail:
      "Portfolio ROI uses the latest finalized architecture review per system. Per-system rows do not sum to the headline — see the proof status strip for scope labels.",
    primaryHref: EXECUTIVE_DASHBOARD_HREF,
    primaryLabel: "Open ROI dashboard",
  },
  {
    title: "Export run-scoped audit CSV",
    shortBody:
      "From a finalized architecture review, export audit events for proof-packet handoff — one click on Artifacts & exports.",
    detail:
      "Review-scoped audit CSV is available from Artifacts & exports. Auditor or Admin role required.",
    primaryHref: "/architecture/reviews",
    primaryLabel: "Open Artifacts & exports",
  },
  {
    title: "Review findings and sponsor exports",
    shortBody:
      "Read governed findings, download sponsor artifacts, and share the proof packet with stakeholders.",
    detail:
      "Open the signed review record summary, findings table, and board-pack or markdown exports when your internal review is complete.",
    primaryHref: "/architecture/reviews",
    primaryLabel: "Inspect review",
  },
];

if (CORE_PILOT_STEPS.length !== CORE_PILOT_STEP_COUNT) {
  throw new Error(
    `CORE_PILOT_STEP_COUNT (${CORE_PILOT_STEP_COUNT}) must match CORE_PILOT_STEPS.length (${CORE_PILOT_STEPS.length}).`,
  );
}
