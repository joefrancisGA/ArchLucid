"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement } from "react";

import {
  FINDING_CORRELATION_VOCABULARY_DISAMBIGUATION_LINES,
  FINDING_CORRELATION_VOCABULARY_DISAMBIGUATION_TITLE,
} from "@/lib/vocabulary/finding-correlation-vocabulary";
import {
  findingCorrelationVocabularyDisclosureHrefFromSearch,
  parseFindingCorrelationVocabularyOpenFromSearch,
} from "@/lib/findings/finding-correlation-vocabulary-disclosure-url";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type FindingCorrelationVocabularyDisambiguationProps = {
  readonly testId?: string;
};

/** Collapsible disambiguation for ADR 0063 vs ITSM vs ROI portfolio deduplication (TB-2065). */
export function FindingCorrelationVocabularyDisambiguation(
  props: FindingCorrelationVocabularyDisambiguationProps,
): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const findingCorrelationVocabularyOpenParam = searchParams.get("findingCorrelationVocabularyOpen");
  const [vocabularyOpen, setVocabularyOpenState] = useState(() =>
    parseFindingCorrelationVocabularyOpenFromSearch(findingCorrelationVocabularyOpenParam),
  );

  const syncVocabularyOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        findingCorrelationVocabularyDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setVocabularyOpen = useCallback(
    (open: boolean) => {
      setVocabularyOpenState(open);
      syncVocabularyOpenToUrl(open);
    },
    [syncVocabularyOpenToUrl],
  );

  useEffect(() => {
    setVocabularyOpenState(parseFindingCorrelationVocabularyOpenFromSearch(findingCorrelationVocabularyOpenParam));
  }, [findingCorrelationVocabularyOpenParam]);

  return (
    <details
      className={cn("mt-4 rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40", OPERATOR_TYPOGRAPHY.helper)}
      data-testid={props.testId ?? "finding-correlation-vocabulary-disambiguation"}
      open={vocabularyOpen}
      onToggle={(event) => {
        setVocabularyOpen(event.currentTarget.open);
      }}
    >
      <summary className={cn("cursor-pointer text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        {FINDING_CORRELATION_VOCABULARY_DISAMBIGUATION_TITLE}
      </summary>
      <ul className="m-0 mt-2 list-disc space-y-2 pl-5 text-al-text-secondary">
        {FINDING_CORRELATION_VOCABULARY_DISAMBIGUATION_LINES.map((line) => (
          <li key={line.label}>
            <strong className="text-al-text-primary">{line.label}:</strong> {line.description}
          </li>
        ))}
      </ul>
    </details>
  );
}
