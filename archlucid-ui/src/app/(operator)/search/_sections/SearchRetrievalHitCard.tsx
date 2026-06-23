import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  buildRetrievalHitActionLink,
  resolveRetrievalHitRunId,
  retrievalHitRelevanceLabel,
  retrievalHitRelevanceTier,
  retrievalHitSourceTypeLabel,
} from "./retrieval-hit-display";
import type { RetrievalHit } from "./retrieval-hit";

export type SearchRetrievalHitCardProps = {
  readonly hit: RetrievalHit;
  readonly scopedRunId?: string;
};

export function SearchRetrievalHitCard(props: SearchRetrievalHitCardProps) {
  const { hit, scopedRunId } = props;
  const sourceLabel = retrievalHitSourceTypeLabel(hit.sourceType);
  const relevanceTier = retrievalHitRelevanceTier(hit.score);
  const relevanceLabel = retrievalHitRelevanceLabel(relevanceTier);
  const runId = resolveRetrievalHitRunId(hit, scopedRunId);
  const actionLink = buildRetrievalHitActionLink(hit, scopedRunId);

  return (
    <Card data-testid="search-retrieval-hit-card">
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="font-semibold text-neutral-900 dark:text-neutral-100">{hit.title}</div>
            {runId !== null ? (
              <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
                <span className="font-medium text-neutral-800 dark:text-neutral-200">Review package:</span> {runId}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs font-medium text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-100">
              {sourceLabel}
            </span>
            <span
              className={cn(
                "rounded-md border px-2 py-0.5 text-xs font-medium",
                relevanceTier === "high"
                  ? "border-teal-200 bg-teal-50 text-teal-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-100"
                  : "border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-300",
              )}
            >
              {relevanceLabel}
            </span>
          </div>
        </div>

        <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
          {hit.text}
        </p>

        {actionLink !== null ? (
          <Link
            href={actionLink.href}
            className="inline-flex text-sm font-medium text-teal-800 underline decoration-teal-300 underline-offset-2 hover:text-teal-950 dark:text-teal-200 dark:decoration-teal-700 dark:hover:text-teal-50"
          >
            {actionLink.label}
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
