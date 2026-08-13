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
 * No status of any kind is inferred from another step's completion — not even in-progress.
 */
export async function resolveGovernanceSetupGuideViewModel(): Promise<GovernanceSetupGuideViewModel> {
  const stepStatuses = initialStepStatuses();

  // Independent GETs — allSettled so one failure cannot blank the other slice (TB-2027).
  const [policySettled, routingSettled] = await Promise.allSettled([
    getEffectivePolicyPacks(),
    listAlertRoutingSubscriptions(),
  ]);

  if (policySettled.status === "fulfilled" && policySettled.value.packs.length > 0) {
    stepStatuses[0] = "complete";
  }

  // TODO: Connect threshold dry-run completion when a workspace signal is exposed for step 2.

  if (routingSettled.status === "fulfilled" && routingSettled.value.length > 0) {
    stepStatuses[2] = "complete";
  }

  // TODO: Connect approval-path / SLA configuration signal when available for step 4.

  // TODO: Connect sponsor reporting readiness signal when available for step 5.

  return {
    stepStatuses,
    steps: GOVERNANCE_SETUP_GUIDE_STEPS,
    foundationIndicators: GOVERNANCE_SETUP_FOUNDATION_INDICATORS,
  };
}
