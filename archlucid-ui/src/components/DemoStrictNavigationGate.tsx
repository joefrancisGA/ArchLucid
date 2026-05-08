"use client";

import { useLayoutEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { isDemoStrictNavigationRedirectsActive } from "@/lib/demo-ui-env";

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
  "/onboarding",
  "/onboard",
];

/**
 * Demo-only guard: redirects blocked operator prefixes (see buyer demo allowlist discussion) back to Home while keeping
 * sponsor-safe routes reachable without server middleware.
 */
export function DemoStrictNavigationGate() {
  const pathname = usePathname();
  const router = useRouter();

  useLayoutEffect(() => {
    if (!isDemoStrictNavigationRedirectsActive()) {
      return;
    }

    if (pathname.startsWith("/auth/")) {
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
