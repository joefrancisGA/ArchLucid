"use client";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";

import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";

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
  const pathname = usePathname() ?? "/";
  const [vocabularyOpen, setVocabularyOpenState] = useState(() =>
    parseFindingCorrelationVocabularyOpenFromSearch(
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("findingCorrelationVocabularyOpen"),
    ),
  );
  const vocabularyOpenRef = useRef(vocabularyOpen);
  vocabularyOpenRef.current = vocabularyOpen;

  const syncVocabularyOpenToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(
        findingCorrelationVocabularyDisclosureHrefFromSearch(readWindowLocationSearch(), open, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setVocabularyOpen = useCallback(
    (open: boolean) => {
      if (vocabularyOpenRef.current === open) {
        return;
      }

      vocabularyOpenRef.current = open;
      setVocabularyOpenState(open);
      syncVocabularyOpenToUrl(open);
    },
    [syncVocabularyOpenToUrl],
  );

  useEffect(() => {
    const syncVocabularyOpenFromUrl = (): void => {
      const next = parseFindingCorrelationVocabularyOpenFromSearch(
        new URLSearchParams(window.location.search).get("findingCorrelationVocabularyOpen"),
      );

      if (vocabularyOpenRef.current === next) {
        return;
      }

      vocabularyOpenRef.current = next;
      setVocabularyOpenState(next);
    };

    syncVocabularyOpenFromUrl();
    window.addEventListener("popstate", syncVocabularyOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncVocabularyOpenFromUrl);
    };
  }, []);

  return (
    <details
      className={cn("mt-4 rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40", OPERATOR_TYPOGRAPHY.helper)}
      data-testid={props.testId ?? "finding-correlation-vocabulary-disambiguation"}
      open={vocabularyOpen}
      onToggle={(event) => {
        event.preventDefault();
        setVocabularyOpen(!vocabularyOpenRef.current);
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
