import {
  evaluateBuyerCtoDemoReadiness,
  type BuyerCtoDemoReadinessVerdict,
} from "@/lib/buyer/buyer-cto-demo-readiness";
import {
  BUYER_CTO_DEMO_ENVIRONMENT_UNAVAILABLE_MESSAGE,
  BUYER_CTO_DEMO_SAMPLE_MODE_NOTICE,
  BUYER_CTO_DEMO_START_FAILED_MESSAGE,
} from "@/lib/buyer/buyer-polish-copy";
import {
  getStartCtoDemoTourHref,
  writeBuyerCtoDemoPreflightAcknowledged,
  writeBuyerCtoDemoTourActive,
} from "@/lib/buyer/buyer-cto-demo-tour";

export type BuyerCtoDemoCustomerStartOutcome =
  | { readonly status: "ready" }
  | { readonly status: "ready-sample"; readonly notice: string }
  | { readonly status: "failed"; readonly message: string };

export function resolveBuyerCtoDemoCustomerStartOutcome(
  verdict: BuyerCtoDemoReadinessVerdict,
): BuyerCtoDemoCustomerStartOutcome {
  if (verdict === "not-ready") {
    return {
      status: "failed",
      message: BUYER_CTO_DEMO_ENVIRONMENT_UNAVAILABLE_MESSAGE,
    };
  }

  if (verdict === "ready-with-static-fallback") {
    return {
      status: "ready-sample",
      notice: BUYER_CTO_DEMO_SAMPLE_MODE_NOTICE,
    };
  }

  return { status: "ready" };
}

/** Customer-safe preflight — no internal check rows or operator diagnostics. */
export async function evaluateBuyerCtoDemoCustomerStart(): Promise<BuyerCtoDemoCustomerStartOutcome> {
  try {
    const result = await evaluateBuyerCtoDemoReadiness();

    return resolveBuyerCtoDemoCustomerStartOutcome(result.verdict);
  } catch {
    return {
      status: "failed",
      message: BUYER_CTO_DEMO_START_FAILED_MESSAGE,
    };
  }
}

export function acknowledgeBuyerCtoDemoCustomerStart(): void {
  writeBuyerCtoDemoPreflightAcknowledged(true);
  writeBuyerCtoDemoTourActive(true);
}

export function buyerCtoDemoCustomerStartHref(): string {
  return getStartCtoDemoTourHref();
}
