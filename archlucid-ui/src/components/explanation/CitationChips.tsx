"use client";
import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";

import { citationKindBuyerLabel } from "@/lib/citation-kind-buyer-label";
import { formatCitationBuyerDisplay } from "@/lib/citation-buyer-display";
import {
  CITATION_CHIPS_TECHNICAL_CITATION_KEY_PARAM,
  citationChipsTechnicalCitationDisclosureHrefFromSearch,
  parseCitationChipsTechnicalCitationKeyFromSearch,
} from "@/lib/explanation/citation-chips-technical-citation-disclosure-url";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { CitationReference } from "@/types/explanation";

export type CitationChipsProps = {
  citations: CitationReference[] | undefined;
  runId: string;
};

function citationHref(c: CitationReference, runId: string, buyerPolishedShell: boolean): string | null {
  const trimmedRunId = runId.trim();
  const trimmedCitationId = c.id?.trim() ?? "";

  if (trimmedRunId.length === 0 || trimmedCitationId.length === 0) {
    return null;
  }

  switch (c.kind) {
    case "Manifest":
      return signedRecordDetailPath(trimmedCitationId);
    case "Finding":

      if (buyerPolishedShell) {
        return `/architecture/reviews/${encodeURIComponent(trimmedRunId)}/findings/${encodeURIComponent(trimmedCitationId)}`;
      }

      return `/architecture/reviews/${encodeURIComponent(trimmedRunId)}#finding-${encodeURIComponent(trimmedCitationId)}`;
    case "DecisionTrace":
    case "GraphSnapshot":
    case "ContextSnapshot":
      return `/architecture/reviews/${encodeURIComponent(trimmedRunId)}/provenance`;
    case "EvidenceBundle":
      return `/architecture/reviews/${encodeURIComponent(trimmedRunId)}`;
    default:
      return `/architecture/reviews/${encodeURIComponent(trimmedRunId)}`;
  }
}

/** Renders persisted artifact links backing aggregate explanation narratives. */
export function CitationChips({ citations, runId }: CitationChipsProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const citationChipsTechnicalCitationKeyParam = searchParams.get(CITATION_CHIPS_TECHNICAL_CITATION_KEY_PARAM);
  const [openCitationKey, setOpenCitationKeyState] = useState(() =>
    parseCitationChipsTechnicalCitationKeyFromSearch(citationChipsTechnicalCitationKeyParam),
  );
  const syncOpenCitationKeyToUrl = useCallback(
    (citationKey: string | null) => {
      router.replace(
        citationChipsTechnicalCitationDisclosureHrefFromSearch(searchParams.toString(), citationKey, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );
  const setOpenCitationKey = useCallback(
    (citationKey: string | null) => {
      setOpenCitationKeyState(citationKey ?? "");
      syncOpenCitationKeyToUrl(citationKey);
    },
    [syncOpenCitationKeyToUrl],
  );
  useEffect(() => {
    setOpenCitationKeyState(parseCitationChipsTechnicalCitationKeyFromSearch(citationChipsTechnicalCitationKeyParam));
  }, [citationChipsTechnicalCitationKeyParam]);

  const buyerPolished = isBuyerPolishedOperatorShellEnv();

  if (citations === undefined || citations === null) {
    return (
      <div className="mb-3" data-testid="citation-chips-empty">
        <h4 className={cn("mb-1.5 font-semibold text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
          {buyerPolished ? "Evidence cited" : "Citations"}
        </h4>
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Citations were not stored on this explanation.
        </p>
      </div>
    );
  }

  if (citations.length === 0) {
    return (
      <div className="mb-3" data-testid="citation-chips-empty">
        <h4 className={cn("mb-1.5 font-semibold text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
          {buyerPolished ? "Evidence cited" : "Citations"}
        </h4>
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Citations were stored empty.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <h4 className={cn("mb-1.5 font-semibold text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
        {buyerPolished ? "Evidence cited" : "Citations"}
      </h4>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {citations.map((c) => {
          const citationIdTrimmed = c.id?.trim() ?? "";
          const citationIdMissing = citationIdTrimmed.length === 0;
          const href = citationHref(c, runId, buyerPolished);
          const kindLabel = citationKindBuyerLabel(c.kind);
          const display = formatCitationBuyerDisplay(c, buyerPolished);
          const citationKey = `${c.kind}-${c.id}`;
          const technicalDetailsOpen = openCitationKey === citationKey;
          const chipClassName = cn(
            "inline-block rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 font-medium text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100",
            href !== null ? "hover:bg-neutral-100 dark:hover:bg-neutral-800" : "cursor-default opacity-90",
            OPERATOR_TYPOGRAPHY.helper,
          );

          return (
            <li key={`${c.kind}-${c.id}`}>
              {href !== null ? (
              <Link
                href={href}
                className={chipClassName}
                aria-label={`${kindLabel}: ${display.headline}`}
              >
                <span className="text-neutral-500 dark:text-neutral-400">{kindLabel}</span> · {display.headline}
              </Link>
              ) : (
              <span
                className={chipClassName}
                aria-label={
                  citationIdMissing
                    ? `${kindLabel}: ${display.headline}. Citation link was not stored.`
                    : `${kindLabel}: ${display.headline}. Review id was not stored.`
                }
              >
                <span className="text-neutral-500 dark:text-neutral-400">{kindLabel}</span> ·{" "}
                {citationIdMissing ? "Citation link was not stored." : display.headline}
              </span>
              )}
              {buyerPolished && display.technicalId !== null ? (
                <details
                  className="mt-1"
                  open={technicalDetailsOpen}
                  onToggle={(event) => {
                    const nextOpen = event.currentTarget.open;
                    setOpenCitationKey(nextOpen ? citationKey : null);
                  }}
                >
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
