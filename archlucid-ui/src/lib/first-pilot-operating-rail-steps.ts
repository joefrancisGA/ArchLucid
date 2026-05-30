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
    primaryHref: "/health",
    primaryLabel: "Open system health",
    troubleshootHelpSlug: "troubleshooting",
  },
  {
    id: "ingest-evidence",
    title: "Ingest architecture evidence",
    shortBody: FIRST_PILOT_BUYER_COPY.ingestEvidenceWithoutUpload,
    primaryHref: "/settings/extract-upload",
    primaryLabel: "Extract and upload",
    troubleshootHelpSlug: "evidence-intake",
  },
  {
    id: "create-review",
    title: "Create an architecture review",
    shortBody: "Capture system identity and constraints in the new-review wizard.",
    primaryHref: "/reviews/new",
    primaryLabel: "New review",
    troubleshootHelpSlug: "pilot-guide",
  },
  {
    id: "execute-review",
    title: "Execute the review pipeline",
    shortBody: "Let agents finish on review detail — status moves to ready to finalize when findings exist.",
    primaryHref: "/reviews?projectId=default",
    primaryLabel: "Open reviews",
    troubleshootHelpSlug: "pilot-guide",
  },
  {
    id: "finalize-package",
    title: "Finalize the review package",
    shortBody: "Commit the golden manifest on review detail to lock artifacts and exports.",
    primaryHref: "/reviews?projectId=default",
    primaryLabel: "Finalize on review detail",
    troubleshootHelpSlug: "governance-approval",
  },
  {
    id: "sponsor-packet",
    title: "Generate sponsor proof packet",
    shortBody: "Download the one-click sponsor ZIP or email the review after finalize — estimated vs realized labels stay explicit.",
    primaryHref: "/reviews?projectId=default",
    primaryLabel: "Open finalized review",
    troubleshootHelpSlug: "executive-summary",
  },
];

if (FIRST_PILOT_OPERATING_RAIL_STEPS.length !== FIRST_PILOT_OPERATING_RAIL_STEP_COUNT) {
  throw new Error(
    `FIRST_PILOT_OPERATING_RAIL_STEP_COUNT (${FIRST_PILOT_OPERATING_RAIL_STEP_COUNT}) must match FIRST_PILOT_OPERATING_RAIL_STEPS.length (${FIRST_PILOT_OPERATING_RAIL_STEPS.length}).`,
  );
}
