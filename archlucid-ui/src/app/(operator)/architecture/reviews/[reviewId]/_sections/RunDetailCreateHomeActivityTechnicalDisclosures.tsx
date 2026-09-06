"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  parseRunDetailActivityTechnicalOpenFromSearch,
  runDetailActivityTechnicalDisclosureHrefFromSearch,
} from "@/lib/runs/run-detail-activity-technical-disclosure-url";
import {
  parseRunDetailActivityOutcomeMetricsOpenFromSearch,
  runDetailActivityOutcomeMetricsDisclosureHrefFromSearch,
} from "@/lib/runs/run-detail-activity-outcome-metrics-disclosure-url";
import { RUN_DETAIL_CREATE_HOME_ACTIVITY_TECHNICAL_DETAIL_SUMMARY } from "@/lib/runs/run-detail-create-home-activity-copy";

type RunDetailCreateHomeActivityTechnicalDisclosuresProps = {
  readonly outcomeCards: ReactNode;
  readonly midDeferred: ReactNode;
  readonly sourcesPanel: ReactNode;
};

export function RunDetailCreateHomeActivityTechnicalDisclosures(
  props: RunDetailCreateHomeActivityTechnicalDisclosuresProps,
): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const runDetailActivityTechnicalOpenParam = searchParams.get("runDetailActivityTechnicalOpen");
  const runDetailActivityOutcomeMetricsOpenParam = searchParams.get("runDetailActivityOutcomeMetricsOpen");
  const [technicalOpen, setTechnicalOpenState] = useState(() =>
    parseRunDetailActivityTechnicalOpenFromSearch(runDetailActivityTechnicalOpenParam),
  );
  const [outcomeMetricsOpen, setOutcomeMetricsOpenState] = useState(() =>
    parseRunDetailActivityOutcomeMetricsOpenFromSearch(runDetailActivityOutcomeMetricsOpenParam),
  );

  const syncTechnicalOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        runDetailActivityTechnicalDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setTechnicalOpen = useCallback(
    (open: boolean) => {
      setTechnicalOpenState(open);
      syncTechnicalOpenToUrl(open);
    },
    [syncTechnicalOpenToUrl],
  );

  const syncOutcomeMetricsOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        runDetailActivityOutcomeMetricsDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setOutcomeMetricsOpen = useCallback(
    (open: boolean) => {
      setOutcomeMetricsOpenState(open);
      syncOutcomeMetricsOpenToUrl(open);
    },
    [syncOutcomeMetricsOpenToUrl],
  );

  useEffect(() => {
    setTechnicalOpenState(parseRunDetailActivityTechnicalOpenFromSearch(runDetailActivityTechnicalOpenParam));
  }, [runDetailActivityTechnicalOpenParam]);

  useEffect(() => {
    setOutcomeMetricsOpenState(
      parseRunDetailActivityOutcomeMetricsOpenFromSearch(runDetailActivityOutcomeMetricsOpenParam),
    );
  }, [runDetailActivityOutcomeMetricsOpenParam]);

  return (
    <details
      className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
      open={technicalOpen}
      data-testid="architecture-activity-technical-detail"
      onToggle={(event) => {
        setTechnicalOpen(event.currentTarget.open);
      }}
    >
      <summary className="cursor-pointer font-semibold">{RUN_DETAIL_CREATE_HOME_ACTIVITY_TECHNICAL_DETAIL_SUMMARY}</summary>
      <div className="mt-3 space-y-4">
        <details
          className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
          open={outcomeMetricsOpen}
          data-testid="architecture-activity-outcome-metrics"
          onToggle={(event) => {
            setOutcomeMetricsOpen(event.currentTarget.open);
          }}
        >
          <summary className="cursor-pointer font-semibold">Outcome metrics and taxonomy</summary>
          <div className="mt-3">{props.outcomeCards}</div>
        </details>
        {props.midDeferred}
        {props.sourcesPanel}
      </div>
    </details>
  );
}
