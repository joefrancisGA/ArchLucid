"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { GraphStaticFallback } from "@/components/GraphStaticFallback";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import {
  OperatorLoadingNotice,
  OperatorMalformedCallout,
  OperatorTryNext,
} from "@/components/OperatorShellMessage";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import {
  loadArchitectureGraphViewModel,
  loadArchitectureGraphViewModelAtAsOf,
} from "@/lib/load-architecture-graph-view-model";
import type { GraphViewModel } from "@/types/graph";
import { Button } from "@/components/ui/button";

const GraphViewer = dynamic(
  () => import("@/components/GraphViewer").then((m) => m.GraphViewer),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading interactive architecture graph"
        className="rounded-lg border border-neutral-200 dark:border-neutral-700"
      >
        <GraphStaticFallback />
      </div>
    ),
  },
);

export type ArchitectureGraphViewerProps = {
  runId: string;
  /** ISO-8601 UTC (or with offset) — this review’s created time; range slider maximum. */
  anchorRunCreatedUtc?: string;
  /** Earliest graph snapshot time in the project (from recent runs list). Range slider minimum. */
  graphHistoryMinCreatedUtc?: string;
  /** Disables the temporal scrubber (e.g. static demo reviews). */
  disableTemporalBrowsing?: boolean;
};

/**
 * Read-only architecture graph preview for run detail: loads `GET /v1/graph/runs/{runId}` and renders React Flow
 * with compact chrome (see {@link GraphViewer} `compactChrome`).
 */
export function ArchitectureGraphViewer(props: ArchitectureGraphViewerProps) {
  const [graph, setGraph] = useState<GraphViewModel | null>(null);
  const [pagingNote, setPagingNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [malformedMessage, setMalformedMessage] = useState<string | null>(null);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [asOfUserMs, setAsOfUserMs] = useState<number | null>(null);

  const minMs = useMemo(() => {
    if (
      props.disableTemporalBrowsing === true ||
      typeof props.graphHistoryMinCreatedUtc !== "string" ||
      props.graphHistoryMinCreatedUtc.trim().length === 0 ||
      typeof props.anchorRunCreatedUtc !== "string" ||
      props.anchorRunCreatedUtc.trim().length === 0
    ) {
      return 0;
    }

    const n = Date.parse(props.graphHistoryMinCreatedUtc.trim());

    return Number.isFinite(n) ? n : 0;
  }, [props.anchorRunCreatedUtc, props.disableTemporalBrowsing, props.graphHistoryMinCreatedUtc]);

  const maxMs = useMemo(() => {
    if (
      props.disableTemporalBrowsing === true ||
      typeof props.anchorRunCreatedUtc !== "string" ||
      props.anchorRunCreatedUtc.trim().length === 0
    ) {
      return 0;
    }

    const n = Date.parse(props.anchorRunCreatedUtc.trim());

    return Number.isFinite(n) ? n : 0;
  }, [props.anchorRunCreatedUtc, props.disableTemporalBrowsing]);

  const useTemporal =
    props.disableTemporalBrowsing !== true &&
    typeof props.graphHistoryMinCreatedUtc === "string" &&
    props.graphHistoryMinCreatedUtc.trim().length > 0 &&
    typeof props.anchorRunCreatedUtc === "string" &&
    props.anchorRunCreatedUtc.trim().length > 0 &&
    maxMs > 0;

  useEffect(() => {
    if (!useTemporal) {
      setAsOfUserMs(null);

      return;
    }

    setAsOfUserMs(maxMs);
  }, [useTemporal, maxMs, props.runId]);

  const effectiveAsOfMs = useMemo(() => {
    if (!useTemporal) {
      return null;
    }

    return asOfUserMs ?? maxMs;
  }, [useTemporal, asOfUserMs, maxMs]);

  useEffect(() => {
    let cancelled = false;
    const rid = props.runId.trim();

    async function runLoad(): Promise<void> {
      setLoading(true);
      setGraph(null);
      setPagingNote(null);
      setMalformedMessage(null);
      setFailure(null);

      if (rid.length === 0) {
        if (!cancelled) {
          setLoading(false);
        }

        return;
      }

      if (useTemporal) {
        if (effectiveAsOfMs === null) {
          return;
        }

        const safeMs = Math.min(Math.max(effectiveAsOfMs, minMs), maxMs);
        const asOfIso = new Date(safeMs).toISOString();
        const result = await loadArchitectureGraphViewModelAtAsOf(rid, asOfIso);

        if (cancelled) {
          return;
        }

        if (!result.ok) {
          if (result.kind === "malformed") {
            setMalformedMessage(result.message);
          } else {
            setFailure(result.failure);
          }

          setLoading(false);

          return;
        }

        const combined =
          result.note !== null && result.note.trim().length > 0 ? result.note : null;

        setGraph(result.graph);
        setPagingNote(combined);
        setLoading(false);

        return;
      }

      const result = await loadArchitectureGraphViewModel(rid);

      if (cancelled) {
        return;
      }

      if (!result.ok) {
        if (result.kind === "malformed") {
          setMalformedMessage(result.message);
        } else {
          setFailure(result.failure);
        }

        setLoading(false);

        return;
      }

      setGraph(result.graph);
      setPagingNote(result.note);
      setLoading(false);
    }

    void runLoad();

    return () => {
      cancelled = true;
    };
  }, [props.runId, useTemporal, effectiveAsOfMs, minMs, maxMs]);

  if (loading) {
    return (
      <OperatorLoadingNotice>
        <strong>Loading architecture graph.</strong>
        <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
          Fetching components and relationships for this review…
        </p>
      </OperatorLoadingNotice>
    );
  }

  if (malformedMessage !== null) {
    return (
      <OperatorMalformedCallout>
        <strong>Architecture graph response was not usable.</strong>
        <p className="mt-2">{malformedMessage}</p>
      </OperatorMalformedCallout>
    );
  }

  if (failure !== null) {
    return (
      <>
        <OperatorApiProblem failure={failure} variant="warning" />
        <div className="mt-3">
          <OperatorTryNext>
            Confirm the review exists and you have access. You can still open the full{" "}
            <Link href={`/graph?runId=${encodeURIComponent(props.runId.trim())}`} className="font-medium underline">
              graph explorer
            </Link>{" "}
            to try other graph modes (review trail, neighborhoods).
          </OperatorTryNext>
        </div>
      </>
    );
  }

  if (graph === null) {
    return null;
  }

  const explorerHref = `/graph?runId=${encodeURIComponent(props.runId.trim())}`;
  const scrubValueMs = Math.min(Math.max(effectiveAsOfMs ?? maxMs, minMs), maxMs);
  const showScrubber = useTemporal && maxMs > minMs;

  return (
    <div className="space-y-3">
      {showScrubber ? (
        <div className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40">
          <label
            className="block text-sm font-medium text-neutral-900 dark:text-neutral-100"
            htmlFor="architecture-graph-as-of-range"
          >
            As-of instant (UTC)
          </label>
          <p className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-400">
            Scrub backward to the latest committed graph snapshot at or before the selected time for this review&apos;s
            project.
          </p>
          <input
            id="architecture-graph-as-of-range"
            data-testid="architecture-graph-as-of-range"
            type="range"
            className="mt-3 w-full"
            aria-label="Select architecture graph as-of time in UTC"
            min={minMs}
            max={maxMs}
            value={scrubValueMs}
            onChange={(ev) => {
              setAsOfUserMs(Number(ev.target.value));
            }}
          />
          <p className="m-0 mt-1 font-mono text-xs text-neutral-700 dark:text-neutral-300" aria-live="polite">
            {new Date(scrubValueMs).toISOString()}
          </p>
        </div>
      ) : null}
      {pagingNote !== null ? (
        <p className="m-0 rounded-md border border-amber-200 bg-amber-50/90 p-2 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-100">
          {pagingNote}
        </p>
      ) : null}
      <GraphViewer graph={graph} runId={props.runId.trim()} presentation="operator" compactChrome />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href={explorerHref}>Open full graph explorer</Link>
        </Button>
        <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
          The explorer supports review-trail views, decision subgraphs, and architecture mode filters.
        </p>
      </div>
    </div>
  );
}
