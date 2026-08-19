"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";

import { citationKindBuyerLabel } from "@/lib/citation-kind-buyer-label";
import { formatCitationBuyerDisplay } from "@/lib/citation-buyer-display";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { CitationReference } from "@/types/explanation";

export type CitationChipsProps = {
  citations: CitationReference[] | undefined;
  runId: string;
};

function citationHref(c: CitationReference, runId: string, buyerPolishedShell: boolean): string {
  switch (c.kind) {
    case "Manifest":
      return signedRecordDetailPath(c.id);
    case "Finding":

      if (buyerPolishedShell) {
        return `/architecture/reviews/${encodeURIComponent(runId)}/findings/${encodeURIComponent(c.id)}`;
      }

      return `/architecture/reviews/${encodeURIComponent(runId)}#finding-${encodeURIComponent(c.id)}`;
    case "DecisionTrace":
    case "GraphSnapshot":
    case "ContextSnapshot":
      return `/architecture/reviews/${encodeURIComponent(runId)}/provenance`;
    case "EvidenceBundle":
      return `/architecture/reviews/${encodeURIComponent(runId)}`;
    default:
      return `/architecture/reviews/${encodeURIComponent(runId)}`;
  }
}

/** Renders persisted artifact links backing aggregate explanation narratives. */
export function CitationChips({ citations, runId }: CitationChipsProps) {
  if (!citations || citations.length === 0) {
    return null;
  }

  const buyerPolished = isBuyerPolishedOperatorShellEnv();

  return (
    <div className="mb-3">
      <h4 className={cn("mb-1.5 font-semibold text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
        {buyerPolished ? "Evidence cited" : "Citations"}
      </h4>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {citations.map((c) => {
          const href = citationHref(c, runId, buyerPolished);
          const kindLabel = citationKindBuyerLabel(c.kind);
          const display = formatCitationBuyerDisplay(c, buyerPolished);

          return (
            <li key={`${c.kind}-${c.id}`}>
              <Link
                href={href}
                className={cn("inline-block rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 font-medium text-neutral-800 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800", OPERATOR_TYPOGRAPHY.helper)}
                aria-label={`${kindLabel}: ${display.headline}`}
              >
                <span className="text-neutral-500 dark:text-neutral-400">{kindLabel}</span> · {display.headline}
              </Link>
              {buyerPolished && display.technicalId !== null ? (
                <details className="mt-1">
                  <summary className={cn("cursor-pointer text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.micro)}>
                    Technical details
                  </summary>
                  <p className={cn("m-0 mt-1 font-mono text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.micro)}>
                    {display.technicalId}
                  </p>
                </details>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
