"use client";

import { useLayoutEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  isCompareRouteBlockedUnderDemoStrictShell,
  isDemoStrictNavigationRedirectsActive,
  isDemoStrictNavigationRedirectsBypassedForE2E,
} from "@/lib/demo-ui-env";

/**
 * Demo-only guard: redirects blocked operator prefixes (see buyer demo allowlist discussion) back to Home while keeping
 * sponsor-safe routes reachable without server middleware.
 *
 * `/onboarding` (and legacy `/onboard`) are not blocked: post-registration trial handoff and mock E2E depend on them even
 * when demo static-operator / demo mode enables this gate.
 */
const DEMO_NAVIGATION_BLOCKED_PREFIXES: readonly string[] = [
  "/admin",
  "/search",
  "/replay",
  "/planning",
  "/digests",
  "/integrations",
  "/advisory",
  "/settings",
  "/product-learning",
  "/recommendation-learning",
  "/evolution-review",
  "/demo/explain",
];

export function DemoStrictNavigationGate() {
  const pathname = usePathname();
  const router = useRouter();

  useLayoutEffect(() => {
    if (isDemoStrictNavigationRedirectsBypassedForE2E()) {
      return;
    }

    if (pathname.startsWith("/auth/")) {
      return;
    }

    if (isCompareRouteBlockedUnderDemoStrictShell() && (pathname === "/compare" || pathname.startsWith("/compare/"))) {
      router.replace("/");

      return;
    }

    if (!isDemoStrictNavigationRedirectsActive()) {
      return;
    }

    for (const prefix of DEMO_NAVIGATION_BLOCKED_PREFIXES) {
      if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
        router.replace("/");

        return;
      }
    }
  }, [pathname, router]);

  return null;
}
