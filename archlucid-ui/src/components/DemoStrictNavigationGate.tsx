"use client";

import { useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { CtoDemoBlockedRoutePanel } from "@/components/cto-demo/CtoDemoBlockedRoutePanel";
import {
  findBlockedRouteEntry,
  resolveDemoBlockedRoutePanel,
} from "@/lib/cto-demo-blocked-route-registry";
import {
  isCompareRouteBlockedUnderDemoStrictShell,
  isDemoStrictNavigationRedirectsActive,
  isDemoStrictNavigationRedirectsBypassedForE2E,
} from "@/lib/demo-ui-env";

export type DemoStrictNavigationGateProps = {
  readonly children: ReactNode;
};

export function DemoStrictNavigationGate(props: DemoStrictNavigationGateProps): React.JSX.Element {
  const { children } = props;
  const pathname = usePathname() ?? "/";

  const blockedEntry = useMemo(() => {
    if (isDemoStrictNavigationRedirectsBypassedForE2E()) {
      return null;
    }

    if (pathname.startsWith("/auth/")) {
      return null;
    }

    if (!isDemoStrictNavigationRedirectsActive()) {
      return null;
    }

    if (isCompareRouteBlockedUnderDemoStrictShell() && (pathname === "/insights/compare-two-reviews" || pathname.startsWith("/insights/compare-two-reviews/"))) {
      return resolveDemoBlockedRoutePanel("/insights/compare-two-reviews");
    }

    return findBlockedRouteEntry(pathname);
  }, [pathname]);

  if (blockedEntry !== null) {
    return <CtoDemoBlockedRoutePanel entry={blockedEntry} />;
  }

  return <>{children}</>;
}
