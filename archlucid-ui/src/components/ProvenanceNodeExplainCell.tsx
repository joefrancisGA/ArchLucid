"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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
        <p className={cn("m-0 max-w-[280px] text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)} aria-live="polite">
          {statusLine}
        </p>
      ) : null}
      {aggregateProxyHref ? (
        <p className={cn("m-0 max-w-[280px]", OPERATOR_TYPOGRAPHY.helper)}>
          <a
            className={OPERATOR_LINK.nav}
            href={aggregateProxyHref}
            target="_blank"
            rel="noreferrer"
          >
            Open review-level summary
          </a>
        </p>
      ) : null}
    </div>
  );
}
