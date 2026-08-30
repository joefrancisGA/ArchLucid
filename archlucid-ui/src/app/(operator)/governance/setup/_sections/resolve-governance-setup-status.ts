import { fetchGovernanceEnvironmentCatalog, fetchGovernanceSetupGuideBundle } from "@/lib/api/policy-governance-api";

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
  let bundleLoadFailed = false;

  try {
    const bundle = await fetchGovernanceSetupGuideBundle();

    if (bundle.effectivePolicyPacks.packs.length > 0) {
      stepStatuses[0] = "complete";
    }

    // Step 2 stays not-started until a workspace signal exists (tracked: false in step definition).

    if (bundle.alertRoutingSubscriptions.length > 0) {
      stepStatuses[2] = "complete";
    }

    try {
      const environmentCatalog = await fetchGovernanceEnvironmentCatalog();

      if (environmentCatalog.isAdministratorConfigured) {
        stepStatuses[3] = "complete";
      }
    } catch {
      // Environment catalog is optional for the rest of the guide; leave step 4 not-started.
    }
  } catch {
    bundleLoadFailed = true;
  }

  // Step 5 stays not-started until a workspace signal exists (tracked: false in step definition).

  return {
    stepStatuses,
    steps: GOVERNANCE_SETUP_GUIDE_STEPS,
    foundationIndicators: GOVERNANCE_SETUP_FOUNDATION_INDICATORS,
    bundleLoadFailed,
  };
}
