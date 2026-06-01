import {
  FIRST_PILOT_OPERATING_RAIL_STEPS,
  type FirstPilotOperatingRailStepDefinition,
  type FirstPilotOperatingRailStepId,
} from "@/lib/first-pilot-operating-rail-steps";

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
    "Six steps from setup verification to a finalized review package. Operate compare, governance dashboards, and V1.1 connectors stay secondary until you have a finalized review package.",
  showHeaderHelpLink: true,
  headerHelpSlug: "first-pilot-path",
  headerHelpLabel: "Full operator path",
  showStepTroubleshootLinks: true,
  minimizedExpandLabel: "Show full operating path",
  completeMessage:
    "Review path complete — share the review package, then open Operate surfaces only when you have a concrete follow-up question.",
  hidePathLabel: "Hide path",
};

const BUYER_SHELL_COPY: FirstPilotOperatingRailShellCopy = {
  heading: "Guided review workflow",
  intro:
    "Six steps from workspace readiness to a signed review package. Complete the core package first — governance, comparison, and audit views are most useful once the evidence record is finalized.",
  showHeaderHelpLink: false,
  headerHelpSlug: "first-pilot-path",
  headerHelpLabel: "Full first-pilot operator path",
  showStepTroubleshootLinks: false,
  minimizedExpandLabel: "Show guided workflow",
  completeMessage:
    "Review workflow complete — share the executive package, then explore governance and audit surfaces when you need deeper assurance.",
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
      "Upload an architecture evidence package or open the sample package to explore without a customer upload.",
    primaryLabel: "Upload evidence",
  },
  "create-review": {
    title: "Create review package",
    shortBody: "Describe system scope, identity, and constraints in the guided new-review flow.",
    primaryLabel: "Create review package",
  },
  "execute-review": {
    title: "Complete the guided assessment",
    shortBody:
      "Finish the guided assessment on review detail — findings and evidence attach to the review package as each stage completes.",
    primaryLabel: "Open reviews",
  },
  "finalize-package": {
    title: "Finalize the review package",
    shortBody: "Lock the signed manifest on review detail to finalize artifacts, governance records, and exports.",
    primaryLabel: "Finalize on review detail",
  },
  "sponsor-packet": {
    title: "Open executive review package",
    shortBody: "Download the executive review package or sponsor briefing after finalize.",
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
