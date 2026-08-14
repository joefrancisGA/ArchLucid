"use client";

import { useEffect, useState, type JSX } from "react";

import { PackageChangesSinceFinalizePanel } from "@/components/PackageChangesSinceFinalizePanel";
import { getRunPipelineTimeline } from "@/lib/api";
import { tryStaticDemoPipelineTimeline } from "@/lib/operator/operator-static-demo";
import type { PackageChangeSourceEvent } from "@/lib/package-changes-since-finalize";

export type RunDetailPackageChangesSinceFinalizeSectionProps = {
  readonly runId: string;
  readonly finalizeUtc: string | null;
};

/**
 * TB-2200 — thin client that reuses GET pipeline-timeline (no new API) for the review-package tab.
 * Activity tab maps the already-loaded below-fold pipeline feed instead of this hop.
 */
export function RunDetailPackageChangesSinceFinalizeSection(
  props: RunDetailPackageChangesSinceFinalizeSectionProps,
): JSX.Element {
  const [events, setEvents] = useState<readonly PackageChangeSourceEvent[] | null>(null);

  useEffect(() => {
    let canceled = false;

    const staticTimeline = tryStaticDemoPipelineTimeline(props.runId);

    if (staticTimeline !== null) {
      setEvents(staticTimeline);
      return () => {
        canceled = true;
      };
    }

    void getRunPipelineTimeline(props.runId)
      .then((rows) => {
        if (!canceled) {
          setEvents(Array.isArray(rows) ? rows : []);
        }
      })
      .catch(() => {
        if (!canceled) {
          setEvents([]);
        }
      });

    return () => {
      canceled = true;
    };
  }, [props.runId]);

  if (events === null) {
    return (
      <div
        className="h-24 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
        role="status"
        aria-label="Loading package changes since finalize"
        data-testid="package-changes-since-finalize-loading"
      />
    );
  }

  return <PackageChangesSinceFinalizePanel events={events} finalizeUtc={props.finalizeUtc} />;
}
