import { getRunSummary } from "@/lib/api";
import {
  BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS,
  resolveBuyerGoldenJourneyNav,
} from "@/lib/buyer-golden-journey-nav";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { fetchHealthReadySummary } from "@/lib/fetch-health-ready";
import {
  isStaticDemoPayloadFallbackEnabled,
  tryStaticDemoManifestSummary,
  tryStaticDemoRunDetail,
} from "@/lib/operator-static-demo";
import {
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";

export type BuyerCtoDemoReadinessCheckId =
  | "buyer-shell"
  | "journey-routes"
  | "showcase-committed"
  | "api-ready";

export type BuyerCtoDemoReadinessCheckStatus = "pass" | "fail" | "warn" | "pending";

export type BuyerCtoDemoReadinessCheck = {
  readonly id: BuyerCtoDemoReadinessCheckId;
  readonly label: string;
  readonly status: BuyerCtoDemoReadinessCheckStatus;
  readonly detail: string;
};

export type BuyerCtoDemoReadinessVerdict = "ready" | "ready-with-static-fallback" | "not-ready";

export type BuyerCtoDemoReadinessResult = {
  readonly verdict: BuyerCtoDemoReadinessVerdict;
  readonly checks: readonly BuyerCtoDemoReadinessCheck[];
};

export function evaluateBuyerCtoDemoJourneyRoutesCheck(): BuyerCtoDemoReadinessCheck {
  const unresolvedSteps = BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS.filter((def) => {
    if (def.href.trim().length === 0) {
      return true;
    }

    return resolveBuyerGoldenJourneyNav(def.href) === null;
  });

  if (unresolvedSteps.length === 0) {
    return {
      id: "journey-routes",
      label: "Five-step demo path",
      status: "pass",
      detail: "Executive summary, signed manifest, evidence trail, governance, and audit routes resolve.",
    };
  }

  return {
    id: "journey-routes",
    label: "Five-step demo path",
    status: "fail",
    detail: `${unresolvedSteps.length} journey step(s) do not resolve in navigation.`,
  };
}

export function evaluateBuyerCtoDemoShellCheck(): BuyerCtoDemoReadinessCheck {
  if (isBuyerPolishedOperatorShellEnv()) {
    return {
      id: "buyer-shell",
      label: "Buyer-polished shell",
      status: "pass",
      detail: "Buyer-safe labels and demo chrome are active.",
    };
  }

  return {
    id: "buyer-shell",
    label: "Buyer-polished shell",
    status: "fail",
    detail: "Unset NEXT_PUBLIC_OPERATOR_EXPERIENCE or enable demo flags for buyer-polished mode.",
  };
}

async function evaluateBuyerCtoDemoShowcaseCommittedCheck(): Promise<BuyerCtoDemoReadinessCheck> {
  try {
    const summary = await getRunSummary(SHOWCASE_STATIC_DEMO_RUN_ID);

    if (summary.hasGoldenManifest === true) {
      return {
        id: "showcase-committed",
        label: "Showcase review finalized",
        status: "pass",
        detail: "Claims Intake showcase review is committed on the API.",
      };
    }

    return {
      id: "showcase-committed",
      label: "Showcase review finalized",
      status: "fail",
      detail: "Showcase review exists but is not finalized — run demo seed or finalize the package.",
    };
  } catch {
    const staticRun = tryStaticDemoRunDetail(SHOWCASE_STATIC_DEMO_RUN_ID);
    const staticManifest = tryStaticDemoManifestSummary(SHOWCASE_STATIC_DEMO_MANIFEST_ID);

    if (
      isStaticDemoPayloadFallbackEnabled() &&
      staticRun !== null &&
      staticManifest !== null &&
      /^committed$/i.test(staticManifest.status ?? "")
    ) {
      return {
        id: "showcase-committed",
        label: "Showcase review finalized",
        status: "warn",
        detail: "API seed not confirmed — curated static showcase payloads will be used.",
      };
    }

    return {
      id: "showcase-committed",
      label: "Showcase review finalized",
      status: "fail",
      detail: "Showcase review not reachable — start the API with demo seed or enable static operator mode.",
    };
  }
}

async function evaluateBuyerCtoDemoApiReadyCheck(): Promise<BuyerCtoDemoReadinessCheck> {
  const health = await fetchHealthReadySummary();

  if (health !== null) {
    return {
      id: "api-ready",
      label: "API readiness",
      status: "pass",
      detail: "Health endpoint responded — live demo data is available.",
    };
  }

  if (isStaticDemoPayloadFallbackEnabled()) {
    return {
      id: "api-ready",
      label: "API readiness",
      status: "warn",
      detail: "API unreachable — static demo payloads will be used for the showcase spine.",
    };
  }

  return {
    id: "api-ready",
    label: "API readiness",
    status: "fail",
    detail: "API health check failed — start ArchLucid.Api before the CTO demo.",
  };
}

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

/** Runs the presenter preflight checks before a CTO demo session. */
export async function evaluateBuyerCtoDemoReadiness(): Promise<BuyerCtoDemoReadinessResult> {
  const checks: BuyerCtoDemoReadinessCheck[] = [
    evaluateBuyerCtoDemoShellCheck(),
    evaluateBuyerCtoDemoJourneyRoutesCheck(),
    await evaluateBuyerCtoDemoShowcaseCommittedCheck(),
    await evaluateBuyerCtoDemoApiReadyCheck(),
  ];

  return {
    verdict: deriveBuyerCtoDemoReadinessVerdict(checks),
    checks,
  };
}

export function buyerCtoDemoReadinessStatusKind(
  verdict: BuyerCtoDemoReadinessVerdict,
): "ready" | "attention" | "blocked" {
  if (verdict === "ready") {
    return "ready";
  }

  if (verdict === "ready-with-static-fallback") {
    return "attention";
  }

  return "blocked";
}
