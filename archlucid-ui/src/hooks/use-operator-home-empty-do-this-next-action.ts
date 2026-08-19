"use client";

import { useEffect, useState } from "react";

import { useFeaturedCompletedSampleQuery } from "@/hooks/use-featured-completed-sample-query";
import { useFinishSetupReadinessContext } from "@/hooks/use-finish-setup-readiness-context";
import {
  isDemoSeededOverviewWorkspaceLabel,
  resolveDemoSeededOverviewSamplePackage,
  shouldInjectDemoSeededOverviewSample,
} from "@/lib/demo-seeded-overview";
import { featuredCompletedSampleReviewHref } from "@/lib/fetch-tenant-homepage-settings-client";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import {
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,
  getEffectiveBrowserProxyScopeHeaders,
  readOperatorScopeFromStorage,
} from "@/lib/operator/operator-scope-storage";
import {
  resolveEmptyHomeDoThisNext,
  type EmptyHomeDoThisNextAction,
} from "@/lib/resolve-empty-home-do-this-next";

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

export type OperatorHomeEmptyDoThisNextActionState = {
  readonly action: EmptyHomeDoThisNextAction;
  readonly sampleLoading: boolean;
};

/** Empty Overview lifecycle guidance shared by the canonical next-action slot (TB-2232). */
export function useOperatorHomeEmptyDoThisNextAction(): OperatorHomeEmptyDoThisNextActionState {
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
  const sampleLoading = action.kind === "sample" && sampleQuery.isPending && !demoSeeded;

  return {
    action,
    sampleLoading,
  };
}
