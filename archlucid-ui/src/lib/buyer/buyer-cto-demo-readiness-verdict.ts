import type { EnterpriseStatusKind } from "@/lib/design-tokens";

import type { BuyerCtoDemoReadinessCheck } from "./buyer-cto-demo-readiness-checks";

export type BuyerCtoDemoReadinessVerdict = "ready" | "ready-with-static-fallback" | "not-ready";

export type BuyerCtoDemoReadinessResult = {
  readonly verdict: BuyerCtoDemoReadinessVerdict;
  readonly checks: readonly BuyerCtoDemoReadinessCheck[];
};

export function deriveBuyerCtoDemoReadinessVerdict(
  checks: readonly BuyerCtoDemoReadinessCheck[],
): BuyerCtoDemoReadinessVerdict {
  if (checks.some((check) => check.status === "fail")) {
    return "not-ready";
  }

  if (checks.some((check) => check.status === "warn")) {
    return "ready-with-static-fallback";
  }

  return "ready";
}

export function buyerCtoDemoReadinessStatusKind(
  verdict: BuyerCtoDemoReadinessVerdict,
): EnterpriseStatusKind {
  if (verdict === "ready") {
    return "ready";
  }

  if (verdict === "ready-with-static-fallback") {
    return "needs-attention";
  }

  return "blocked";
}
