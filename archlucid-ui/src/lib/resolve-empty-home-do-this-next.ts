import {
  OPERATOR_HOME_DEMO_SEEDED_SAMPLE_BRIDGE,
  OPERATOR_HOME_DO_THIS_NEXT_SETUP_BRIDGE,
  OPERATOR_HOME_OPEN_SAMPLE_PACKAGE_CTA,
  PILOT_FIRST_HOUR_NO_RUN_BRIDGE_COPY,
} from "@/lib/buyer/buyer-polish-copy";
import { isSelfHostedDeploymentEnv } from "@/lib/finish-setup-deployment";
import {
  FINISH_SETUP_WIZARD_STEPS,
  type FinishSetupWizardContext,
  type FinishSetupWizardStep,
  resolveFinishSetupWizardSteps,
} from "@/lib/finish-setup-wizard-steps";
import { resolveOperatorHomeWorkspaceReadiness } from "@/lib/operator/operator-home-workspace-readiness";
import {
  GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_PRIMARY_CTA,
  buildGoldenSponsorPackageWalkthroughHref,
  buildGoldenSponsorPackageWalkthroughHrefFromReviewPath,
} from "@/lib/golden-sponsor-package-walkthrough";

export type EmptyHomeDoThisNextAction = {
  readonly label: string;
  readonly href: string;
  readonly bridgeCopy: string;
  readonly kind: "setup" | "sample";
};

function toSetupAction(
  step: FinishSetupWizardStep,
  bridgeCopy: string,
): EmptyHomeDoThisNextAction {
  return {
    kind: "setup",
    label: step.cta,
    href: step.href,
    bridgeCopy,
  };
}

function resolveBlockingSetupAction(
  ctx: FinishSetupWizardContext,
): EmptyHomeDoThisNextAction | null {
  const readiness = resolveOperatorHomeWorkspaceReadiness(ctx);

  if (readiness.canBegin) {
    return null;
  }

  const bridgeCopy = readiness.blockerMessage ?? OPERATOR_HOME_DO_THIS_NEXT_SETUP_BRIDGE;

  if (isSelfHostedDeploymentEnv() && (!ctx.healthReady || ctx.healthLoadFailed)) {
    const healthStep = FINISH_SETUP_WIZARD_STEPS.find((step) => step.id === "health");

    if (healthStep !== undefined) {
      return toSetupAction(healthStep, bridgeCopy);
    }
  }

  if (!ctx.principalAdmin) {
    const adminStep = FINISH_SETUP_WIZARD_STEPS.find((step) => step.id === "admin-role");

    if (adminStep !== undefined) {
      return toSetupAction(adminStep, bridgeCopy);
    }
  }

  // Fallback: first incomplete required wizard step (excludes never-done optional identity).
  const nextRequired = resolveFinishSetupWizardSteps().find(
    (step) => step.id !== "identity" && !step.isDone(ctx),
  );

  if (nextRequired === undefined) {
    return null;
  }

  return toSetupAction(nextRequired, bridgeCopy);
}

function resolveSampleHref(sampleHref: string | null | undefined): string {
  if (typeof sampleHref === "string" && sampleHref.trim().length > 0) {
    return sampleHref.trim();
  }

  return buildGoldenSponsorPackageWalkthroughHref();
}

function resolveSampleAction(sampleHref: string | null | undefined): EmptyHomeDoThisNextAction {
  let href = buildGoldenSponsorPackageWalkthroughHref();

  if (typeof sampleHref === "string" && sampleHref.trim().length > 0) {
    const trimmed = sampleHref.trim();

    href =
      buildGoldenSponsorPackageWalkthroughHrefFromReviewPath(trimmed) ?? trimmed;
  }

  return {
    kind: "sample",
    label: GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_PRIMARY_CTA,
    href,
    bridgeCopy: PILOT_FIRST_HOUR_NO_RUN_BRIDGE_COPY,
  };
}

function resolveDemoSeededSampleAction(
  sampleHref: string | null | undefined,
): EmptyHomeDoThisNextAction {
  return {
    kind: "sample",
    label: OPERATOR_HOME_OPEN_SAMPLE_PACKAGE_CTA,
    href: resolveSampleHref(sampleHref),
    bridgeCopy: OPERATOR_HOME_DEMO_SEEDED_SAMPLE_BRIDGE,
  };
}

/**
 * Single primary CTA for empty Overview (no workspace reviews) — setup blockers first, then sample (TB-1038).
 * Demo/seeded pins skip setup and open the sample package (TB-1039).
 * Prefer a workspace featured-sample href when the caller has resolved one.
 */
export function resolveEmptyHomeDoThisNext(input: {
  readonly setupContext: FinishSetupWizardContext | null;
  readonly sampleHref?: string | null;
  readonly demoSeededOverview?: boolean;
}): EmptyHomeDoThisNextAction {
  if (input.demoSeededOverview === true) {
    return resolveDemoSeededSampleAction(input.sampleHref);
  }

  if (input.setupContext !== null) {
    const setupAction = resolveBlockingSetupAction(input.setupContext);

    if (setupAction !== null) {
      return setupAction;
    }
  }

  return resolveSampleAction(input.sampleHref);
}
