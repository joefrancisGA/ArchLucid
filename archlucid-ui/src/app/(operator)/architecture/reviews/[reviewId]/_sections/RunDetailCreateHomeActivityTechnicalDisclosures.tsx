"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
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
  const pathname = usePathname() ?? "/";
  const [technicalOpen, setTechnicalOpenState] = useState(() =>
    parseRunDetailActivityTechnicalOpenFromSearch(
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("runDetailActivityTechnicalOpen"),
    ),
  );
  const technicalOpenRef = useRef(technicalOpen);
  technicalOpenRef.current = technicalOpen;
  const [outcomeMetricsOpen, setOutcomeMetricsOpenState] = useState(() =>
    parseRunDetailActivityOutcomeMetricsOpenFromSearch(
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("runDetailActivityOutcomeMetricsOpen"),
    ),
  );
  const outcomeMetricsOpenRef = useRef(outcomeMetricsOpen);
  outcomeMetricsOpenRef.current = outcomeMetricsOpen;

  const syncTechnicalOpenToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(
        runDetailActivityTechnicalDisclosureHrefFromSearch(readWindowLocationSearch(), open, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setTechnicalOpen = useCallback(
    (open: boolean) => {
      if (technicalOpenRef.current === open) {
        return;
      }

      technicalOpenRef.current = open;
      setTechnicalOpenState(open);
      syncTechnicalOpenToUrl(open);
    },
    [syncTechnicalOpenToUrl],
  );

  const syncOutcomeMetricsOpenToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(
        runDetailActivityOutcomeMetricsDisclosureHrefFromSearch(readWindowLocationSearch(), open, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setOutcomeMetricsOpen = useCallback(
    (open: boolean) => {
      if (outcomeMetricsOpenRef.current === open) {
        return;
      }

      outcomeMetricsOpenRef.current = open;
      setOutcomeMetricsOpenState(open);
      syncOutcomeMetricsOpenToUrl(open);
    },
    [syncOutcomeMetricsOpenToUrl],
  );

  useEffect(() => {
    const syncTechnicalOpenFromUrl = (): void => {
      const nextOpen = parseRunDetailActivityTechnicalOpenFromSearch(
        new URLSearchParams(window.location.search).get("runDetailActivityTechnicalOpen"),
      );

      if (technicalOpenRef.current === nextOpen) {
        return;
      }

      technicalOpenRef.current = nextOpen;
      setTechnicalOpenState(nextOpen);
    };

    syncTechnicalOpenFromUrl();
    window.addEventListener("popstate", syncTechnicalOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncTechnicalOpenFromUrl);
    };
  }, []);

  useEffect(() => {
    const syncOutcomeMetricsOpenFromUrl = (): void => {
      const nextOpen = parseRunDetailActivityOutcomeMetricsOpenFromSearch(
        new URLSearchParams(window.location.search).get("runDetailActivityOutcomeMetricsOpen"),
      );

      if (outcomeMetricsOpenRef.current === nextOpen) {
        return;
      }

      outcomeMetricsOpenRef.current = nextOpen;
      setOutcomeMetricsOpenState(nextOpen);
    };

    syncOutcomeMetricsOpenFromUrl();
    window.addEventListener("popstate", syncOutcomeMetricsOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncOutcomeMetricsOpenFromUrl);
    };
  }, []);

  return (
    <details
      className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
      open={technicalOpen}
      data-testid="architecture-activity-technical-detail"
      onToggle={(event) => {
        event.preventDefault();
        setTechnicalOpen(!technicalOpen);
      }}
    >
      <summary className="cursor-pointer font-semibold">{RUN_DETAIL_CREATE_HOME_ACTIVITY_TECHNICAL_DETAIL_SUMMARY}</summary>
      <div className="mt-3 space-y-4">
        <details
          className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
          open={outcomeMetricsOpen}
          data-testid="architecture-activity-outcome-metrics"
          onToggle={(event) => {
            event.preventDefault();
            setOutcomeMetricsOpen(!outcomeMetricsOpen);
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
