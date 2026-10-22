"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { readBuyerCtoDemoTourActive, resolveBuyerCtoDemoTourNavigation } from "@/lib/buyer/buyer-cto-demo-tour";
import { BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS } from "@/lib/buyer/buyer-golden-journey-nav";
import type { BlockedRouteEntry } from "@/lib/cto-demo-blocked-route-registry";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type CtoDemoBlockedRoutePanelProps = {
  readonly entry: BlockedRouteEntry;
};

export function CtoDemoBlockedRoutePanel(props: CtoDemoBlockedRoutePanelProps): React.JSX.Element {
  const { entry } = props;
  const pathname = usePathname() ?? "/";

  const returnHref = useMemo(() => {
    if (!readBuyerCtoDemoTourActive()) {
      return "/";
    }

    const navigation = resolveBuyerCtoDemoTourNavigation(pathname);

    if (navigation.stepIndex !== null) {
      return BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS[navigation.stepIndex]?.href ?? BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS[0]?.href ?? "/";
    }

    return navigation.next?.href ?? BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS[0]?.href ?? "/";
  }, [pathname]);

  useEffect(() => {
    document.title = `${entry.label} — ArchLucid`;
  }, [entry.label]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-2xl items-center justify-center p-4" data-testid="cto-demo-blocked-route-panel">
      <Card className="w-full border-neutral-200 dark:border-neutral-700">
        <CardHeader>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.badge, "text-neutral-500 dark:text-neutral-400")}>ArchLucid</p>
          <CardTitle className={cn("mt-1", OPERATOR_TYPOGRAPHY.pageTitle)}>{entry.label}</CardTitle>
          <CardDescription>
            This area is available in a provisioned ArchLucid tenant. During this showcase, the five-step review journey is
            live — {entry.label.toLowerCase()} and similar surfaces are available post-signup.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>{entry.description}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" asChild data-testid="cto-demo-blocked-return">
              <Link href={returnHref}>Return to demo</Link>
            </Button>
            <Button type="button" size="sm" variant="outline" asChild>
              <Link href="/signup">Request access</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
