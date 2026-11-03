import {
  FIRST_REVIEW_GUIDE_POLICY_PACK_ASSIGNMENT_COPY,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_HOME_CHOOSE_SAMPLE_REVIEW_CTA } from "@/lib/buyer-copy/operator-home-sample";
import type { FinishSetupWizardContext } from "@/lib/finish-setup-wizard-steps";
import {
  resolveFinishSetupWizardDeploymentOptions,
  resolveFinishSetupWizardSteps,
} from "@/lib/finish-setup-wizard-steps";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";

import type { FirstReviewGuideStateInput } from "./first-review-guide-status";

export type FirstReviewGuideRequiredBlocker = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly actionLabel: string;
};

export type FirstReviewGuidePrerequisiteInput = {
  readonly samplePackageSelected: boolean | null;
  readonly policyPackAssigned: boolean | null;
};

export function resolveFirstReviewGuideOnePrerequisite(
  input: FirstReviewGuidePrerequisiteInput,
): FirstReviewGuideRequiredBlocker | null {
  if (input.samplePackageSelected === null || input.policyPackAssigned === null) {
    return null;
  }

  if (!input.samplePackageSelected) {
    return {
      id: "sample-package",
      title: "Sample package",
      description: "Select a completed sample package for this workspace.",
      href: "/",
      actionLabel: OPERATOR_HOME_CHOOSE_SAMPLE_REVIEW_CTA,
    };
  }

  if (!input.policyPackAssigned) {
    return {
      id: "policy-pack",
      title: "Policy pack",
      description: FIRST_REVIEW_GUIDE_POLICY_PACK_ASSIGNMENT_COPY,
      href: GOVERNANCE_POLICY_PACKS_PATH,
      actionLabel: "Review policy pack assignments",
    };
  }

  return null;
}

export function resolveFirstReviewGuideRequiredBlockers(
  input: FirstReviewGuideStateInput,
): readonly FirstReviewGuideRequiredBlocker[] {
  const deployment = resolveFinishSetupWizardDeploymentOptions();
  const finishContext = input.finishSetupContext;

  if (!deployment.selfHosted || finishContext === null) {
    return [];
  }

  const healthStep = resolveFinishSetupWizardSteps(deployment).find((step) => step.id === "health");

  if (healthStep === undefined) {
    return [];
  }

  if (healthStep.isDone(finishContext)) {
    return [];
  }

  return [
    {
      id: "platform-health",
      title: "Platform health",
      description: "Required services must be healthy before your first review on a self-hosted deployment.",
      href: healthStep.href,
      actionLabel: healthStep.cta,
    },
  ];
}

export function resolveFirstReviewGuidePolicyPackAssigned(
  workspaceSelection: readonly { readonly isEnabled: boolean }[] | null,
): boolean | null {
  if (workspaceSelection === null) {
    return null;
  }

  return workspaceSelection.some((item) => item.isEnabled);
}
