import type { FinishSetupWizardContext } from "@/lib/finish-setup-wizard-steps";
import {
  resolveFinishSetupWizardDeploymentOptions,
  resolveFinishSetupWizardSteps,
} from "@/lib/finish-setup-wizard-steps";

import type { FirstReviewGuideStateInput } from "./first-review-guide-status";

export type FirstReviewGuideRequiredBlocker = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly actionLabel: string;
};

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