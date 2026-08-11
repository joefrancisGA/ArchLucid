import {
  FIRST_PILOT_OPERATING_RAIL_STEPS,
  type FirstPilotOperatingRailStepDefinition,
  type FirstPilotOperatingRailStepId,
} from "@/lib/first-pilot-operating-rail-steps";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA, CREATE_REVIEW_PACKAGE_HEADING } from "@/lib/buyer-polish-copy";

export type FirstPilotOperatingRailShellCopy = {
  readonly heading: string;
  readonly intro: string;
  readonly showHeaderHelpLink: boolean;
  readonly headerHelpSlug: string;
  readonly headerHelpLabel: string;
  readonly showStepTroubleshootLinks: boolean;
  readonly minimizedExpandLabel: string;
  readonly completeMessage: string;
  readonly hidePathLabel: string;
};

const OPERATOR_SHELL_COPY: FirstPilotOperatingRailShellCopy = {
  heading: "Full operating path",
  intro:
    "Six steps from setup verification to a finalized review. Operate compare, governance dashboards, and future connectors stay secondary until you have a finalized review.",
  showHeaderHelpLink: true,
  headerHelpSlug: "first-architecture-review",
  headerHelpLabel: "Architecture review walkthrough",
  showStepTroubleshootLinks: true,
  minimizedExpandLabel: "Show full operating path",
  completeMessage:
    "Review path complete — share the review, then open Operate surfaces only when you have a concrete follow-up question.",
  hidePathLabel: "Hide path",
};

const BUYER_SHELL_COPY: FirstPilotOperatingRailShellCopy = {
  heading: "Guided review workflow",
  intro:
    "Six steps from workspace readiness to a signed review. Complete the core review workflow first — governance, comparison, and audit views are most useful once the evidence record is finalized.",
  showHeaderHelpLink: false,
  headerHelpSlug: "first-architecture-review",
  headerHelpLabel: "Architecture review walkthrough",
  showStepTroubleshootLinks: false,
  minimizedExpandLabel: "Show guided workflow",
  completeMessage:
    "Review workflow complete — share the executive export, then explore governance and audit surfaces when you need deeper assurance.",
  hidePathLabel: "Hide workflow",
};

type FirstPilotOperatingRailStepTextOverride = Pick<
  FirstPilotOperatingRailStepDefinition,
  "title" | "shortBody" | "primaryLabel"
>;

const BUYER_STEP_TEXT_OVERRIDES: Record<FirstPilotOperatingRailStepId, FirstPilotOperatingRailStepTextOverride> = {
  "verify-setup": {
    title: "Confirm workspace readiness",
    shortBody: "Confirm sign-in and workspace readiness before adding evidence or starting a review.",
    primaryLabel: "Confirm readiness",
  },
  "ingest-evidence": {
    title: "Add architecture evidence",
    shortBody:
      "Upload an architecture evidence bundle, or open the example review to preview the output before your own upload.",
    primaryLabel: "Upload evidence",
  },
  "create-review": {
    title: CREATE_REVIEW_PACKAGE_HEADING,
    shortBody: "Describe system scope, identity, and constraints in the guided new-review flow.",
    primaryLabel: BUYER_START_ARCHITECTURE_REVIEW_CTA,
  },
  "execute-review": {
    title: "Complete the guided assessment",
    shortBody:
      "Finish the guided assessment on review detail — findings and evidence attach to the review as each stage completes.",
    primaryLabel: "Open reviews",
  },
  "finalize-package": {
    title: "Finalize the review",
    shortBody: "Lock the signed review record on review detail to finalize governance records and exports.",
    primaryLabel: "Finalize on review detail",
  },
  "sponsor-packet": {
    title: "Open executive review",
    shortBody: "Download the executive review or sponsor briefing after finalize.",
    primaryLabel: "Open finalized review",
  },
};

export function resolveFirstPilotOperatingRailShellCopy(buyerPolishedShell: boolean): FirstPilotOperatingRailShellCopy {
  if (buyerPolishedShell) {
    return BUYER_SHELL_COPY;
  }

  return OPERATOR_SHELL_COPY;
}

export function resolveFirstPilotOperatingRailStepsForDisplay(
  buyerPolishedShell: boolean,
): FirstPilotOperatingRailStepDefinition[] {
  if (!buyerPolishedShell) {
    return FIRST_PILOT_OPERATING_RAIL_STEPS;
  }

  return FIRST_PILOT_OPERATING_RAIL_STEPS.map((step) => {
    const override = BUYER_STEP_TEXT_OVERRIDES[step.id];

    return {
      ...step,
      title: override.title,
      shortBody: override.shortBody,
      primaryLabel: override.primaryLabel,
    };
  });
}
