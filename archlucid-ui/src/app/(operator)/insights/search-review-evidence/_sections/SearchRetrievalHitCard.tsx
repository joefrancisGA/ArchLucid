import { cn } from "@/lib/utils";
import Link from "next/link";

import { FindingEvidenceLinkChip } from "@/components/usability/FindingEvidenceLinkChip";
import { Card, CardContent } from "@/components/ui/card";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import {
  buildRetrievalHitActionLink,
  buildRetrievalHitEvidenceTrailHref,
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
  const evidenceTrailHref = buildRetrievalHitEvidenceTrailHref(hit, scopedRunId);

  return (
    <Card data-testid="search-retrieval-hit-card">
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{hit.title}</div>
            {runId !== null ? (
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                <span className="font-medium text-al-text-primary">Review:</span> {runId}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-medium text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900/60",
                OPERATOR_TYPOGRAPHY.badge,
              )}
            >
              {sourceLabel}
            </span>
            <span
              className={cn(
                "rounded-md border px-2 py-0.5 font-medium",
                OPERATOR_TYPOGRAPHY.badge,
                relevanceTier === "high"
                  ? "border-teal-200 bg-teal-50 text-teal-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-100"
                  : "border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-300",
              )}
            >
              {relevanceLabel}
            </span>
          </div>
        </div>

        <p className={cn("m-0 whitespace-pre-wrap leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {hit.text}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {actionLink !== null ? (
            <Link href={actionLink.href} className={cn("inline-flex", OPERATOR_LINK.nav)}>
              {actionLink.label}
            </Link>
          ) : null}
          {evidenceTrailHref !== null ? <FindingEvidenceLinkChip href={evidenceTrailHref} /> : null}
        </div>
      </CardContent>
    </Card>
  );
}
