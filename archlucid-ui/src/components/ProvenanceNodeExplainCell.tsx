"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { fetchProvenanceNodeExplanationViaProxy } from "@/lib/fetch-provenance-node-explanation";

type Props = {
  runId: string;
  nodeId: string;
};

/** Legacy per-node URL returns 501 Problem+JSON; UI surfaces detail and link to run-level aggregate explanation. */
export function ProvenanceNodeExplainCell({ runId, nodeId }: Props) {
  const [statusLine, setStatusLine] = useState<string>("");
  const [aggregateProxyHref, setAggregateProxyHref] = useState<string | null>(null);

  async function explain(): Promise<void> {
    setStatusLine("Requesting explanation…");
    setAggregateProxyHref(null);

    const result = await fetchProvenanceNodeExplanationViaProxy(runId, nodeId);

    setStatusLine(result.message);

    setAggregateProxyHref(result.aggregateProxyHref);
  }

  return (
    <div className="flex flex-col gap-1">
      <Button type="button" variant="outline" size="sm" className="h-8 whitespace-nowrap" onClick={() => void explain()}>
        Explain node
      </Button>
      {statusLine ? (
        <p className="m-0 max-w-[280px] text-[11px] text-neutral-600 dark:text-neutral-400" aria-live="polite">
          {statusLine}
        </p>
      ) : null}
      {aggregateProxyHref ? (
        <p className="m-0 max-w-[280px] text-[11px]">
          <a
            className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            href={aggregateProxyHref}
            target="_blank"
            rel="noreferrer"
          >
            Open run-level summary
          </a>
        </p>
      ) : null}
    </div>
  );
}
