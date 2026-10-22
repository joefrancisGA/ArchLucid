import {
  ARCHITECTURES_LIST_PATH,
  ARCHITECTURES_NEW_PATH,
  REVIEWS_LIST_PATH,
  REVIEWS_NEW_PATH,
} from "@/lib/architecture/architecture-routes";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";

export type CorePilotStepBase = {
  title: string;
  shortBody: string;
  detail?: string;
  primaryHref: string;
  primaryLabel: string;
};

/**
 * Core Pilot path titles and links — shared between the first-review checklist and diagnostics summary on operator home.
 * IR-002: Working afternoon is architecture-nested findings; review-detail is the job inspector, not Home.
 *
 * {@link CORE_PILOT_STEP_COUNT} must match `CORE_PILOT_STEPS.length` (enforced at module load).
 */
export const CORE_PILOT_STEP_COUNT = 7;

export const EXTRACT_UPLOAD_SETTINGS_PATH = "/administration/extract-upload";

export const CORE_PILOT_STEPS: CorePilotStepBase[] = [
  {
    title: "Open your architecture desk",
    shortBody:
      "Start from the architecture portfolio — each system is the object you inhabit for the afternoon, not a reviews inbox row.",
    detail:
      "Open an architecture identity desk to capture system context. After Start review, Working lands on architecture-nested findings when the parent architecture is known.",
    primaryHref: ARCHITECTURES_LIST_PATH,
    primaryLabel: "Open architecture portfolio",
  },
  {
    title: "Start review from this system",
    shortBody:
      "Start a new architecture review from the wizard or open the curated sample — Record + Simulator honesty appears before execute when it applies.",
    detail:
      "Use New architecture review for guided intake. Create architecture drafts separately when you want to save intent without starting a review.",
    primaryHref: REVIEWS_NEW_PATH,
    primaryLabel: "Start or open review",
  },
  {
    title: "Work findings on the inhabited document",
    shortBody:
      "Disposition, transparency trail, and quiet-engine honesty live on architecture-nested findings — not review Overview as Home.",
    detail:
      "After spawn, continue on the open architecture findings document. Use review detail only as a job inspector when you need recovery or exports.",
    primaryHref: ARCHITECTURES_LIST_PATH,
    primaryLabel: "Open architecture desk",
  },
  {
    title: "Finalize when ready",
    shortBody:
      "Finalize is a verb on the findings document that returns you to the architecture desk — it locks the sealed review record.",
    detail:
      "Finalization produces the finalized architecture review. Policy rules may block finalize when blocking findings remain.",
    primaryHref: ARCHITECTURES_LIST_PATH,
    primaryLabel: "Return to architecture desk",
  },
  {
    title: "Upload Azure inventory ZIP",
    shortBody:
      "Optional for document/brief-only reviews — upload a read-only Azure packager ZIP to unblock inventory-backed findings and cost ROI.",
    detail:
      "Run scripts/azure/Get-ArchLucidAzurePackage.ps1 in your tenant, then upload the ZIP from Extract & Upload or review detail. V1 is customer-side packager upload — not a live subscription pull unless hosted extractor is configured. AWS and GCP inventory stay optional follow-ups.",
    primaryHref: EXTRACT_UPLOAD_SETTINGS_PATH,
    primaryLabel: "Upload Azure inventory ZIP",
  },
  {
    title: "Review portfolio ROI",
    shortBody:
      "Open the sponsor ROI summary on the dashboard — confirm evidence freshness and disposition-aware headline scope.",
    detail:
      "Portfolio ROI uses the latest finalized architecture review per system. Per-system rows do not sum to the headline — see the proof status strip for scope labels.",
    primaryHref: SPONSOR_DASHBOARD_HREF,
    primaryLabel: "Open ROI dashboard",
  },
  {
    title: "Share sealed package and exports",
    shortBody:
      "After seal, open the reviews inbox or architecture desk for sponsor exports, audit CSV, and stakeholder handoff.",
    detail:
      "Review-scoped audit CSV is available from Artifacts & exports on the sealed review record. Board-pack or markdown exports ship from the finalized review inspector.",
    primaryHref: REVIEWS_LIST_PATH,
    primaryLabel: "Open reviews inbox",
  },
];

if (CORE_PILOT_STEPS.length !== CORE_PILOT_STEP_COUNT) {
  throw new Error(
    `CORE_PILOT_STEP_COUNT (${CORE_PILOT_STEP_COUNT}) must match CORE_PILOT_STEPS.length (${CORE_PILOT_STEPS.length}).`,
  );
}
