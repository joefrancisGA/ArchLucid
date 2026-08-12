import { ensureAppInsights } from "@/lib/telemetry";
import {
  isNextPublicDemoMode,
  isOperatorExperienceFullShellEnv,
} from "@/lib/demo-ui-env";
import type { NavTier } from "@/lib/nav-tier";
import { normalizeTelemetryRoute } from "@/lib/telemetry/telemetry-route-normalizer";
import type { OperateNavUnlockPhase } from "@/lib/usability/operate-nav-progressive-unlock";

import type { RouteReferrerType } from "@/lib/operator/operator-navigation-referrer";

export type OperatorShellTelemetryMode = "demo" | "full-operator" | "buyer-polished";

export type OperateNavUnlockPhaseChangeReason =
  | "first-committed-review"
  | "manual-unlock"
  | "compare-visit"
  | "disclosure-toggle"
  | "persist";

function isDemoStaticOperatorBuild(): boolean {
  const raw = (process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR ?? "").trim().toLowerCase();

  return raw === "1" || raw === "true";
}

/** Shell chrome bucket for nav and route-entry dimensions (IA-019). */
export function resolveOperatorShellTelemetryMode(): OperatorShellTelemetryMode {
  if (isNextPublicDemoMode() || isDemoStaticOperatorBuild()) {
    return "demo";
  }

  if (isOperatorExperienceFullShellEnv()) {
    return "full-operator";
  }

  return "buyer-polished";
}

export type NavLinkClickTelemetryInput = {
  readonly href: string;
  readonly group: string;
  readonly tier: NavTier;
  readonly unlockPhase: OperateNavUnlockPhase;
  readonly shellMode?: OperatorShellTelemetryMode;
};

export function trackNavLinkClick(input: NavLinkClickTelemetryInput): void {
  const href = input.href.trim();

  if (href.length === 0) {
    return;
  }

  void ensureAppInsights().then((ai) => {
    if (ai === null) {
      return;
    }

    ai.trackEvent(
      { name: "NavLinkClick" },
      {
        href,
        group: input.group,
        tier: input.tier,
        unlockPhase: String(input.unlockPhase),
        shellMode: input.shellMode ?? resolveOperatorShellTelemetryMode(),
      },
    );
  });
}

export type RouteEnteredTelemetryInput = {
  readonly pathname: string;
  readonly referrerType: RouteReferrerType;
  readonly shellMode?: OperatorShellTelemetryMode;
};

export function trackRouteEntered(input: RouteEnteredTelemetryInput): void {
  const normalizedRoute = normalizeTelemetryRoute(input.pathname);

  void ensureAppInsights().then((ai) => {
    if (ai === null) {
      return;
    }

    ai.trackEvent(
      { name: "RouteEntered" },
      {
        route: normalizedRoute,
        referrerType: input.referrerType,
        shellMode: input.shellMode ?? resolveOperatorShellTelemetryMode(),
      },
    );
  });
}

export type UnlockPhaseChangedTelemetryInput = {
  readonly previousPhase: OperateNavUnlockPhase;
  readonly newPhase: OperateNavUnlockPhase;
  readonly reason: OperateNavUnlockPhaseChangeReason;
  readonly shellMode?: OperatorShellTelemetryMode;
};

export function trackUnlockPhaseChanged(input: UnlockPhaseChangedTelemetryInput): void {
  if (input.previousPhase === input.newPhase) {
    return;
  }

  void ensureAppInsights().then((ai) => {
    if (ai === null) {
      return;
    }

    ai.trackEvent(
      { name: "UnlockPhaseChanged" },
      {
        previousPhase: String(input.previousPhase),
        newPhase: String(input.newPhase),
        reason: input.reason,
        shellMode: input.shellMode ?? resolveOperatorShellTelemetryMode(),
      },
    );
  });
}
