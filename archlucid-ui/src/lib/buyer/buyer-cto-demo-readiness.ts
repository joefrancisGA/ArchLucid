import { getRunSummary } from "@/lib/api";
import { getBearerToken } from "@/lib/api/http";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import {
  BUYER_DEMO_READINESS_BUYER_API_UNAVAILABLE,
  BUYER_DEMO_READINESS_BUYER_AUTH_REQUIRED,
  BUYER_DEMO_READINESS_OPERATOR_API_START_REQUIRED,
  BUYER_DEMO_READINESS_OPERATOR_AUTH_REQUIRED,
  BUYER_DEMO_READINESS_OPERATOR_SHOWCASE_API_MISSING,
  BUYER_DEMO_READINESS_OPERATOR_SHOWCASE_NOT_FINALIZED,
  BUYER_DEMO_READINESS_SAMPLE_PREPARING_DETAIL,
  BUYER_DEMO_READINESS_SAMPLE_READY_DETAIL,
  BUYER_DEMO_READINESS_SAMPLE_UNAVAILABLE_DETAIL,
} from "@/lib/buyer/buyer-polish-copy";
import {
  BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS,
  resolveBuyerGoldenJourneyNav,
} from "@/lib/buyer/buyer-golden-journey-nav";
import { isCtoDemoOperatorToolingEnv } from "@/lib/cto-demo-presenter-pack";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { fetchHealthReadySummary } from "@/lib/fetch-health-ready";
import { fetchLlmMonthlyDollarBudgetStatusCached } from "@/lib/llm-monthly-budget-status";
import { getDemoSampleAuditTrailEvents } from "@/lib/demo-audit-sample-events";
import { DEMO_MINIMUM_SESSION_SECONDS, decodeJwtExpirySeconds } from "@/lib/jwt-expiry";
import {
  areSpineStaticDemoPayloadsAvailable,
  isShowcaseSpineStaticPayloadActiveForRun,
  isStaticDemoPayloadFallbackEnabled,
  tryStaticDemoManifestSummary,
  tryStaticDemoProvenanceGraph,
  tryStaticDemoGovernanceApprovalRequests,
} from "@/lib/operator/operator-static-demo";
import {
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";
import { TRIAL_ONBOARDING_SAMPLE_RUN_ID } from "@/lib/trial-sample-run";

export type BuyerCtoDemoReadinessCheckId =
  | "buyer-shell"
  | "journey-routes"
  | "showcase-committed"
  | "spine-offline"
  | "compare-seeded"
  | "api-ready"
  | "llm-budget"
  | "demo-auth"
  | "static-label"
  | "showcase-only";

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

/** Buyer-safe detail by default; internal setup instructions only for demo-operator tooling. */
function readinessDetail(buyerFacing: string, operatorFacing: string): string {
  if (isCtoDemoOperatorToolingEnv()) {
    return operatorFacing;
  }

  return buyerFacing;
}

function isShowcaseStaticSpineReady(): boolean {
  if (!isShowcaseSpineStaticPayloadActiveForRun(SHOWCASE_STATIC_DEMO_RUN_ID)) {
    return false;
  }

  const staticManifest = tryStaticDemoManifestSummary(SHOWCASE_STATIC_DEMO_MANIFEST_ID);

  if (staticManifest === null) {
    return false;
  }

  return /^committed$/i.test(staticManifest.status ?? "");
}

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
      detail: "Executive summary, signed review record, evidence trail, governance, and audit routes resolve.",
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
    detail: readinessDetail(
      "Workspace presentation is not ready.",
      "Unset NEXT_PUBLIC_OPERATOR_EXPERIENCE or enable demo flags for buyer-polished mode.",
    ),
  };
}

async function evaluateBuyerCtoDemoShowcaseCommittedCheck(): Promise<BuyerCtoDemoReadinessCheck> {
  if (isShowcaseStaticSpineReady()) {
    try {
      const summary = await getRunSummary(TRIAL_ONBOARDING_SAMPLE_RUN_ID);

      if (summary.hasGoldenManifest === true) {
        return {
          id: "showcase-committed",
          label: "Showcase review finalized",
          status: "pass",
          detail: readinessDetail(
            BUYER_DEMO_READINESS_SAMPLE_READY_DETAIL,
            "Claims Intake showcase review is committed on the API.",
          ),
        };
      }
    } catch {
      // Static spine still satisfies buyer-facing readiness when curated payloads are active.
    }

    return {
      id: "showcase-committed",
      label: "Showcase review finalized",
      status: "pass",
      detail: readinessDetail(
        BUYER_DEMO_READINESS_SAMPLE_READY_DETAIL,
        "API seed not confirmed — curated static showcase payloads will be used.",
      ),
    };
  }

  try {
    const summary = await getRunSummary(TRIAL_ONBOARDING_SAMPLE_RUN_ID);

    if (summary.hasGoldenManifest === true) {
      return {
        id: "showcase-committed",
        label: "Showcase review finalized",
        status: "pass",
        detail: readinessDetail(
          BUYER_DEMO_READINESS_SAMPLE_READY_DETAIL,
          "Claims Intake showcase review is committed on the API.",
        ),
      };
    }

    return {
      id: "showcase-committed",
      label: "Showcase review finalized",
      status: "fail",
      detail: readinessDetail(
        BUYER_DEMO_READINESS_SAMPLE_PREPARING_DETAIL,
        BUYER_DEMO_READINESS_OPERATOR_SHOWCASE_NOT_FINALIZED,
      ),
    };
  } catch {
    return {
      id: "showcase-committed",
      label: "Showcase review finalized",
      status: "fail",
      detail: readinessDetail(
        BUYER_DEMO_READINESS_SAMPLE_UNAVAILABLE_DETAIL,
        BUYER_DEMO_READINESS_OPERATOR_SHOWCASE_API_MISSING,
      ),
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
      detail: readinessDetail(
        BUYER_DEMO_READINESS_SAMPLE_READY_DETAIL,
        "API unreachable — static demo payloads will be used for the showcase spine.",
      ),
    };
  }

  return {
    id: "api-ready",
    label: "API readiness",
    status: "fail",
    detail: readinessDetail(
      BUYER_DEMO_READINESS_BUYER_API_UNAVAILABLE,
      BUYER_DEMO_READINESS_OPERATOR_API_START_REQUIRED,
    ),
  };
}

async function evaluateBuyerCtoDemoLlmBudgetCheck(): Promise<BuyerCtoDemoReadinessCheck> {
  try {
    const status = await fetchLlmMonthlyDollarBudgetStatusCached();

    if (status.blocksAdditionalLlmExecution) {
      return {
        id: "llm-budget",
        label: "LLM execution budget",
        status: "fail",
        detail: readinessDetail(
          "Review automation is temporarily limited.",
          "Monthly LLM budget is exhausted — use seeded showcase or simulator paths on stage.",
        ),
      };
    }

    return {
      id: "llm-budget",
      label: "LLM execution budget",
      status: "pass",
      detail: "LLM execution budget has headroom for optional live-create beats.",
    };
  } catch {
    return {
      id: "llm-budget",
      label: "LLM execution budget",
      status: "warn",
      detail: readinessDetail(
        "Budget status is temporarily unavailable.",
        "Budget status unavailable — prefer seeded showcase over live pipeline on stage.",
      ),
    };
  }
}

export function evaluateBuyerCtoDemoAuthCheck(): BuyerCtoDemoReadinessCheck {
  if (isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled()) {
    return {
      id: "demo-auth",
      label: "Demo auth bypass",
      status: "pass",
      detail: "Demo packaging flags allow the showcase without full tenant sign-in.",
    };
  }

  const bearer = typeof window !== "undefined" ? getBearerToken() : undefined;

  if (bearer !== undefined && bearer.trim().length > 0) {
    const expSeconds = decodeJwtExpirySeconds(bearer.trim());

    if (expSeconds !== null) {
      const remainingSeconds = expSeconds - Math.floor(Date.now() / 1000);

      if (remainingSeconds < 0) {
        return {
          id: "demo-auth",
          label: "Demo auth bypass",
          status: "fail",
          detail: readinessDetail(
            BUYER_DEMO_READINESS_BUYER_AUTH_REQUIRED,
            "Session has already expired — sign in before presenting.",
          ),
        };
      }

      if (remainingSeconds < DEMO_MINIMUM_SESSION_SECONDS) {
        return {
          id: "demo-auth",
          label: "Demo auth bypass",
          status: "warn",
          detail: `Session expires in ~${Math.round(remainingSeconds / 60)} min — re-authenticate before a 30-minute demo.`,
        };
      }

      return {
        id: "demo-auth",
        label: "Demo auth bypass",
        status: "pass",
        detail: `Signed-in session is active for ~${Math.round(remainingSeconds / 60)} min.`,
      };
    }

    return {
      id: "demo-auth",
      label: "Demo auth bypass",
      status: "pass",
      detail: "Signed-in session is active for live API-backed demo data.",
    };
  }

  return {
    id: "demo-auth",
    label: "Demo auth bypass",
    status: "fail",
    detail: readinessDetail(
      BUYER_DEMO_READINESS_BUYER_AUTH_REQUIRED,
      BUYER_DEMO_READINESS_OPERATOR_AUTH_REQUIRED,
    ),
  };
}

export function evaluateBuyerCtoDemoShowcaseOnlyCheck(): BuyerCtoDemoReadinessCheck {
  if (isStaticDemoPayloadFallbackEnabled()) {
    return {
      id: "showcase-only",
      label: "Non-showcase run protection",
      status: "pass",
      detail: "Demo guard active — accidental non-showcase runs show a redirect prompt.",
    };
  }

  return {
    id: "showcase-only",
    label: "Non-showcase run protection",
    status: "pass",
    detail: "Live API — tour guard covers unfinished runs when the CTO demo is active.",
  };
}

export function evaluateBuyerCtoDemoSpineOfflineCheck(): BuyerCtoDemoReadinessCheck {
  if (!isStaticDemoPayloadFallbackEnabled()) {
    return {
      id: "spine-offline",
      label: "Offline spine payloads",
      status: "pass",
      detail: "Live API path — static spine payloads not required.",
    };
  }

  const graph = tryStaticDemoProvenanceGraph(SHOWCASE_STATIC_DEMO_RUN_ID);
  const governance = tryStaticDemoGovernanceApprovalRequests(SHOWCASE_STATIC_DEMO_RUN_ID);
  const auditSampleCount = getDemoSampleAuditTrailEvents().length;

  if (graph !== null && governance !== null && auditSampleCount >= 8 && areSpineStaticDemoPayloadsAvailable()) {
    return {
      id: "spine-offline",
      label: "Offline spine payloads",
      status: "pass",
      detail: "Graph, governance, audit, signed review record, and compare static payloads are available for all five steps.",
    };
  }

  return {
    id: "spine-offline",
    label: "Offline spine payloads",
    status: "warn",
    detail: readinessDetail(
      "Some sample review details are temporarily unavailable.",
      "One or more spine static payloads are missing — some demo steps may require a live API.",
    ),
  };
}

export function evaluateBuyerCtoDemoCompareSeededCheck(): BuyerCtoDemoReadinessCheck {
  if (!isStaticDemoPayloadFallbackEnabled()) {
    return {
      id: "compare-seeded",
      label: "Compare demo pair",
      status: "pass",
      detail: "Live API path — compare uses live runs when available.",
    };
  }

  if (areSpineStaticDemoPayloadsAvailable()) {
    return {
      id: "compare-seeded",
      label: "Compare demo pair",
      status: "pass",
      detail: "Prior and later Claims Intake compare payloads are seeded.",
    };
  }

  return {
    id: "compare-seeded",
    label: "Compare demo pair",
    status: "warn",
    detail: readinessDetail(
      "Compare sample data is temporarily unavailable.",
      "Compare static payloads are not fully available.",
    ),
  };
}

export function evaluateBuyerCtoDemoStaticLabelCheck(): BuyerCtoDemoReadinessCheck {
  if (isStaticDemoPayloadFallbackEnabled()) {
    return {
      id: "static-label",
      label: "Static data labeling",
      status: "warn",
      detail: readinessDetail(
        "Sample review data is shown from cached workspace content.",
        "Static fallback is on — presenter banner will show cached showcase data to you.",
      ),
    };
  }

  return {
    id: "static-label",
    label: "Static data labeling",
    status: "pass",
    detail: "Live API path — static-data banner appears only if the API fails mid-demo.",
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
