import { BUYER_START_ARCHITECTURE_REVIEW_CTA, CREATE_REVIEW_PACKAGE_HEADING } from "@/lib/buyer/buyer-polish-copy";
import { FIRST_PILOT_BUYER_COPY } from "@/lib/first-pilot-buyer-copy";

export const FIRST_PILOT_OPERATING_RAIL_STEP_COUNT = 6;

export type FirstPilotOperatingRailStepId =
  | "verify-setup"
  | "ingest-evidence"
  | "create-review"
  | "execute-review"
  | "finalize-package"
  | "sponsor-packet";

export type FirstPilotOperatingRailStepDefinition = {
  id: FirstPilotOperatingRailStepId;
  title: string;
  shortBody: string;
  primaryHref: string;
  primaryLabel: string;
  /** In-app help slug (`/help/{slug}`) for step-level triage. */
  troubleshootHelpSlug: string;
};

export const FIRST_PILOT_OPERATING_RAIL_STEPS: FirstPilotOperatingRailStepDefinition[] = [
  {
    id: "verify-setup",
    title: "Verify platform setup",
    shortBody: "Confirm API readiness and sign-in before you ingest evidence or start a review.",
    primaryHref: "/administration/system-health",
    primaryLabel: "Open system health",
    troubleshootHelpSlug: "troubleshooting",
  },
  {
    id: "ingest-evidence",
    title: "Ingest architecture evidence",
    shortBody: FIRST_PILOT_BUYER_COPY.ingestEvidenceWithoutUpload,
    primaryHref: "/administration/extract-upload",
    primaryLabel: "Add evidence",
    troubleshootHelpSlug: "evidence-intake",
  },
  {
    id: "create-review",
    title: CREATE_REVIEW_PACKAGE_HEADING,
    shortBody: "Capture system identity and constraints in the new-review wizard.",
    primaryHref: "/architecture/reviews/new",
    primaryLabel: BUYER_START_ARCHITECTURE_REVIEW_CTA,
    troubleshootHelpSlug: "pilot-guide",
  },
  {
    id: "execute-review",
    title: "Execute the review pipeline",
    shortBody: "Let agents finish on review detail — status moves to ready to finalize when findings exist.",
    primaryHref: "/architecture/reviews",
    primaryLabel: "Open reviews",
    troubleshootHelpSlug: "pilot-guide",
  },
  {
    id: "finalize-package",
    title: "Finalize the review",
    shortBody: "Finalize the sealed review record on review detail to lock artifacts and exports.",
    primaryHref: "/architecture/reviews",
    primaryLabel: "Finalize on review detail",
    troubleshootHelpSlug: "governance-approval",
  },
  {
    id: "sponsor-packet",
    title: "Generate sponsor proof packet",
    shortBody: "Download the one-click sponsor ZIP or email the review after finalize — estimated vs realized labels stay explicit.",
    primaryHref: "/architecture/reviews",
    primaryLabel: "Open finalized review",
    troubleshootHelpSlug: "sponsor-report",
  },
];

if (FIRST_PILOT_OPERATING_RAIL_STEPS.length !== FIRST_PILOT_OPERATING_RAIL_STEP_COUNT) {
  throw new Error(
    `FIRST_PILOT_OPERATING_RAIL_STEP_COUNT (${FIRST_PILOT_OPERATING_RAIL_STEP_COUNT}) must match FIRST_PILOT_OPERATING_RAIL_STEPS.length (${FIRST_PILOT_OPERATING_RAIL_STEPS.length}).`,
  );
}
