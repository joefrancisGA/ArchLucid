import { getEffectivePolicyPacks, listAlertRoutingSubscriptions } from "@/lib/api";

import {
  GOVERNANCE_SETUP_FOUNDATION_INDICATORS,
  GOVERNANCE_SETUP_GUIDE_STEPS,
} from "./governance-setup-guide-steps";
import type { GovernanceSetupGuideViewModel, GovernanceSetupStepStatus } from "./governance-setup-guide-types";

function initialStepStatuses(): GovernanceSetupStepStatus[] {
  return GOVERNANCE_SETUP_GUIDE_STEPS.map(() => "not-started");
}

/**
 * Resolves workspace-backed completion signals for the governance setup guide.
 * Steps without a reliable signal stay not-started (never fabricated complete).
 */
export async function resolveGovernanceSetupGuideViewModel(): Promise<GovernanceSetupGuideViewModel> {
  const stepStatuses = initialStepStatuses();

  try {
    const effectivePolicyPacks = await getEffectivePolicyPacks();

    if (effectivePolicyPacks.packs.length > 0) {
      stepStatuses[0] = "complete";
    }
  } catch {
    // Keep step 1 not-started when policy data is unavailable.
  }

  // TODO: Connect threshold dry-run completion when a workspace signal is exposed for step 2.
  if (stepStatuses[0] === "complete" && stepStatuses[1] !== "complete") {
    stepStatuses[1] = "in-progress";
  }

  try {
    const routingSubscriptions = await listAlertRoutingSubscriptions();

    if (routingSubscriptions.length > 0) {
      stepStatuses[2] = "complete";
    }
  } catch {
    // Keep step 3 not-started when alert routing data is unavailable.
  }

  // TODO: Connect approval-path / SLA configuration signal when available for step 4.

  // TODO: Connect sponsor reporting readiness signal when available for step 5.

  return {
    stepStatuses,
    steps: GOVERNANCE_SETUP_GUIDE_STEPS,
    foundationIndicators: GOVERNANCE_SETUP_FOUNDATION_INDICATORS,
  };
}
