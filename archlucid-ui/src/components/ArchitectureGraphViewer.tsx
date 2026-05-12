"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";

import { GraphStaticFallback } from "@/components/GraphStaticFallback";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import {
  OperatorLoadingNotice,
  OperatorMalformedCallout,
  OperatorTryNext,
} from "@/components/OperatorShellMessage";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { loadArchitectureGraphViewModel } from "@/lib/load-architecture-graph-view-model";
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
  }, [props.runId]);

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

  return (
    <div className="space-y-3">
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
