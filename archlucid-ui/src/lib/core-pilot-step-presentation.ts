import { CORE_PILOT_STEPS } from "@/lib/core-pilot-steps";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

export const CORE_PILOT_FINAL_STEP_INDEX = CORE_PILOT_STEPS.length - 1;

export type CorePilotCommitPresentationContext = {
  readonly hasCommittedManifest: boolean;
  readonly latestCommittedRunId: string | null;
};

export type CorePilotStepPresentation = {
  readonly href: string;
  readonly label: string;
};

export type FirstRunWizardModeInput = {
  readonly hasCommittedManifest: boolean;
  readonly storedMode: "quick" | "full" | null;
};

/** First-run tenants default to quick start; returning tenants honor stored preference. */
export function resolveFirstRunWizardMode(input: FirstRunWizardModeInput): "quick" | "full" {
  if (input.hasCommittedManifest) {
    if (input.storedMode === "quick" || input.storedMode === "full") {
      return input.storedMode;
    }

    return "full";
  }

  if (input.storedMode === "full") {
    return "full";
  }

  return "quick";
}

/** First-time operators see advanced wizard steps only after explicit opt-in. */
export function shouldShowWizardModeToggle(
  hasCommittedManifest: boolean,
  advancedConfigurationOptIn: boolean,
): boolean {
  if (hasCommittedManifest) {
    return true;
  }

  return advancedConfigurationOptIn;
}

/** Resolves step CTA copy — step 5 links to sample review until the tenant has a committed package. */
export function resolveCorePilotStepPresentation(
  stepIndex: number,
  ctx: CorePilotCommitPresentationContext,
): CorePilotStepPresentation {
  const step = CORE_PILOT_STEPS[stepIndex];
  const defaultPresentation: CorePilotStepPresentation = {
    href: step.primaryHref,
    label: step.primaryLabel,
  };

  if (stepIndex !== CORE_PILOT_FINAL_STEP_INDEX) {
    return defaultPresentation;
  }

  if (ctx.hasCommittedManifest && ctx.latestCommittedRunId !== null) {
    return {
      href: `/architecture/reviews/${encodeURIComponent(ctx.latestCommittedRunId)}`,
      label: "Open finalized review",
    };
  }

  return {
    href: `/architecture/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`,
    label: "Open sample finalized review",
  };
}
