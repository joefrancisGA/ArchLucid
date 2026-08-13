"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useFeaturedCompletedSampleQuery } from "@/hooks/use-featured-completed-sample-query";
import { useFinishSetupReadinessContext } from "@/hooks/use-finish-setup-readiness-context";
import {
  isDemoSeededOverviewWorkspaceLabel,
  resolveDemoSeededOverviewSamplePackage,
  shouldInjectDemoSeededOverviewSample,
} from "@/lib/demo-seeded-overview";
import { OPERATOR_LAYOUT, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { featuredCompletedSampleReviewHref } from "@/lib/fetch-tenant-homepage-settings-client";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import {
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,
  getEffectiveBrowserProxyScopeHeaders,
  readOperatorScopeFromStorage,
} from "@/lib/operator/operator-scope-storage";
import { resolveEmptyHomeDoThisNext } from "@/lib/resolve-empty-home-do-this-next";
import { cn } from "@/lib/utils";

function resolveFeaturedSampleHref(
  sample:
    | {
        readonly isAvailable: boolean;
        readonly selectedRunId: string | null;
      }
    | undefined,
): string | null {
  if (sample === undefined || !sample.isAvailable || sample.selectedRunId === null) {
    return null;
  }

  const runId = sample.selectedRunId.trim();

  if (runId.length === 0) {
    return null;
  }

  return featuredCompletedSampleReviewHref(runId);
}

function resolveDemoSeededFlag(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const scopeHeaders = getEffectiveBrowserProxyScopeHeaders();
  const workspaceLabel = readOperatorScopeFromStorage()?.workspaceLabel ?? null;

  return (
    shouldInjectDemoSeededOverviewSample({
      itemCount: 0,
      scopeHeaders,
      workspaceLabel,
      staticDemoFallbackEnabled: isStaticDemoPayloadFallbackEnabled(),
    }) || isDemoSeededOverviewWorkspaceLabel(workspaceLabel)
  );
}

/** Empty Overview — one primary next step; demo/seeded pins open the sample package (TB-1038 / TB-1039). */
export function OperatorHomeDoThisNextCard(): React.JSX.Element {
  const readiness = useFinishSetupReadinessContext();
  const sampleQuery = useFeaturedCompletedSampleQuery();
  const featuredHref = resolveFeaturedSampleHref(sampleQuery.data);
  // Start false on SSR so production empty tenants do not inherit dev-default demo scope.
  const [demoSeeded, setDemoSeeded] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setDemoSeeded(resolveDemoSeededFlag());
    };

    refresh();
    window.addEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, refresh);

    return () => {
      window.removeEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, refresh);
    };
  }, []);

  const demoSample =
    demoSeeded && typeof window !== "undefined"
      ? resolveDemoSeededOverviewSamplePackage(getEffectiveBrowserProxyScopeHeaders())
      : null;
  const sampleHref = demoSample?.href ?? featuredHref;
  const action = resolveEmptyHomeDoThisNext({
    setupContext: readiness.context,
    sampleHref,
    demoSeededOverview: demoSeeded,
  });

  return (
    <div className={cn("space-y-3", OPERATOR_LAYOUT.inlineGap)} data-testid="operator-home-do-this-next">
      <p
        className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}
        data-testid="operator-home-do-this-next-bridge"
      >
        {action.bridgeCopy}
      </p>

      {action.kind === "sample" && sampleQuery.isPending && !demoSeeded ? (
        <p
          className={cn("m-0", OPERATOR_TYPE_SCALE.micro, "text-al-text-secondary")}
          aria-live="polite"
          data-testid="operator-home-do-this-next-sample-loading"
        >
          Loading completed sample…
        </p>
      ) : (
        <Button asChild variant="primary" size="sm" className="h-8 w-fit shrink-0">
          <Link href={action.href} data-testid="operator-home-do-this-next-primary">
            {action.label}
          </Link>
        </Button>
      )}
    </div>
  );
}
