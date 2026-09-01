import {
  evaluateBuyerCtoDemoApiReadyCheck,
  evaluateBuyerCtoDemoAuthCheck,
  evaluateBuyerCtoDemoCompareSeededCheck,
  evaluateBuyerCtoDemoJourneyRoutesCheck,
  evaluateBuyerCtoDemoLlmBudgetCheck,
  evaluateBuyerCtoDemoShellCheck,
  evaluateBuyerCtoDemoShowcaseCommittedCheck,
  evaluateBuyerCtoDemoShowcaseOnlyCheck,
  evaluateBuyerCtoDemoSpineOfflineCheck,
  evaluateBuyerCtoDemoStaticLabelCheck,
  type BuyerCtoDemoReadinessCheck,
} from "./buyer-cto-demo-readiness-checks";
import {
  deriveBuyerCtoDemoReadinessVerdict,
  type BuyerCtoDemoReadinessResult,
} from "./buyer-cto-demo-readiness-verdict";

export type {
  BuyerCtoDemoReadinessCheck,
  BuyerCtoDemoReadinessCheckId,
  BuyerCtoDemoReadinessCheckStatus,
} from "./buyer-cto-demo-readiness-checks";
export type { BuyerCtoDemoReadinessResult, BuyerCtoDemoReadinessVerdict } from "./buyer-cto-demo-readiness-verdict";

export {
  evaluateBuyerCtoDemoApiReadyCheck,
  evaluateBuyerCtoDemoAuthCheck,
  evaluateBuyerCtoDemoCompareSeededCheck,
  evaluateBuyerCtoDemoJourneyRoutesCheck,
  evaluateBuyerCtoDemoLlmBudgetCheck,
  evaluateBuyerCtoDemoShellCheck,
  evaluateBuyerCtoDemoShowcaseCommittedCheck,
  evaluateBuyerCtoDemoShowcaseOnlyCheck,
  evaluateBuyerCtoDemoSpineOfflineCheck,
  evaluateBuyerCtoDemoStaticLabelCheck,
} from "./buyer-cto-demo-readiness-checks";
export { buyerCtoDemoReadinessStatusKind, deriveBuyerCtoDemoReadinessVerdict } from "./buyer-cto-demo-readiness-verdict";

/** Runs the presenter preflight checks before a CTO demo session. */
export async function evaluateBuyerCtoDemoReadiness(): Promise<BuyerCtoDemoReadinessResult> {
  const checks: BuyerCtoDemoReadinessCheck[] = [
    evaluateBuyerCtoDemoShellCheck(),
    evaluateBuyerCtoDemoJourneyRoutesCheck(),
    await evaluateBuyerCtoDemoShowcaseCommittedCheck(),
    evaluateBuyerCtoDemoSpineOfflineCheck(),
    evaluateBuyerCtoDemoCompareSeededCheck(),
    await evaluateBuyerCtoDemoApiReadyCheck(),
    await evaluateBuyerCtoDemoLlmBudgetCheck(),
    evaluateBuyerCtoDemoAuthCheck(),
    evaluateBuyerCtoDemoStaticLabelCheck(),
    evaluateBuyerCtoDemoShowcaseOnlyCheck(),
  ];

  return {
    verdict: deriveBuyerCtoDemoReadinessVerdict(checks),
    checks,
  };
}
