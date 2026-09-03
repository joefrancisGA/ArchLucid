"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useRunSummaryQuery } from "@/hooks/use-run-summary-query";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { RunSummary } from "@/types/authority";

function runSummaryActivityFingerprint(summary: RunSummary): string {
  return [
    summary.authorityLifecyclePhase ?? "unknown-phase",
    summary.hasGoldenManifest === true ? "manifest" : "no-manifest",
    summary.runDegradedExecution === true ? "degraded" : "stable",
  ].join("|");
}

type ReviewWorkspaceStaleBannerProps = {
  readonly runId: string;
};

/** Surfaces remote review activity when cached summary diverges from live authority state. */
export function ReviewWorkspaceStaleBanner(props: ReviewWorkspaceStaleBannerProps): React.JSX.Element | null {
  const query = useRunSummaryQuery(props.runId, { authoritative: true });
  const baselineFingerprintRef = useRef<string | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (query.data === undefined) {
      return;
    }

    const liveFingerprint = runSummaryActivityFingerprint(query.data);

    if (baselineFingerprintRef.current === null) {
      baselineFingerprintRef.current = liveFingerprint;

      return;
    }

    if (baselineFingerprintRef.current !== liveFingerprint) {
      setShowBanner(true);
    }
  }, [query.data]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        void query.refetch();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [query]);

  if (!showBanner) {
    return null;
  }

  return (
    <div
      className={cn(DESIGN_TOKENS.callout.warn, "flex flex-wrap items-center justify-between gap-3 px-4 py-3")}
      data-testid="review-workspace-stale-banner"
      role="status"
    >
      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        This review was updated elsewhere or has new activity. Refresh to load the latest status before you decide.
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          void query.refetch().then((result) => {
            if (result.data !== undefined) {
              baselineFingerprintRef.current = runSummaryActivityFingerprint(result.data);
            }

            setShowBanner(false);
          });
        }}
      >
        Refresh review
      </Button>
    </div>
  );
}
