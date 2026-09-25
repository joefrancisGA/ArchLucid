"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { SeverityTag } from "@/components/ui/severity-tag";
import {
  ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_INDEX_FILTER_HINT,
  ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_INDEX_FILTER_LABEL,
  ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_INDEX_TITLE,
  ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_ROWS,
} from "@/lib/engineering-troubleshooting-help-guide-content";
import {
  parseHelpEngineeringTroubleshootingSearchQuery,
  helpEngineeringTroubleshootingSearchHrefFromSearch,
} from "@/lib/help/help-engineering-troubleshooting-search-url";
import { helpEngineeringTroubleshootingSymptomRunbookHrefFromSearch } from "@/lib/help/help-engineering-troubleshooting-symptom-runbook-url";
import { OPERATOR_LINK, OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, HELP_PAGE_TOC } from "@/lib/help/help-page-layout";
import { cn } from "@/lib/utils";

function matchesSymptomFilter(query: string, haystack: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return true;
  }

  return haystack.toLowerCase().includes(normalizedQuery);
}

/** Filterable symptom lookup for the engineering troubleshooting runbook (HDX). */
export function HelpEngineeringTroubleshootingSymptomIndex(): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/help/engineering-troubleshooting";
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const urlQuery = parseHelpEngineeringTroubleshootingSearchQuery(searchParams.get("q"));
  const [filter, setFilter] = useState(urlQuery);
  const filterInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFilter(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const nextHref = helpEngineeringTroubleshootingSearchHrefFromSearch(currentSearch, filter, pathname);

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [currentSearch, filter, pathname, router]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const target = event.target;

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      filterInputRef.current?.focus();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const navigateToRunbookSection = useCallback(
    (sectionId: string): void => {
      const nextHref = helpEngineeringTroubleshootingSymptomRunbookHrefFromSearch(currentSearch, sectionId, pathname);

      router.push(nextHref);
    },
    [currentSearch, pathname, router],
  );

  const visibleRows = ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_ROWS.filter((row) => {
    const haystack = `${row.symptom} ${row.firstCheck} ${row.evidenceToAttach} ${row.escalationDestinationLabel}`;

    return matchesSymptomFilter(filter, haystack);
  });

  return (
    <section
      aria-labelledby="help-engineering-troubleshooting-symptom-index-heading"
      className="space-y-4"
      data-testid="help-engineering-troubleshooting-symptom-index"
    >
      <h2
        id="help-engineering-troubleshooting-symptom-index-heading"
        className={cn("m-0", OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_INDEX_TITLE}
      </h2>

      <div className="space-y-1">
        <label
          htmlFor="help-engineering-troubleshooting-symptom-filter"
          className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
        >
          {ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_INDEX_FILTER_LABEL}
        </label>
        <input
          ref={filterInputRef}
          id="help-engineering-troubleshooting-symptom-filter"
          type="search"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="e.g. 401, 503, migration"
          className={HELP_PAGE_TOC.referenceSearchInput}
          data-testid="help-engineering-troubleshooting-symptom-filter"
        />
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="help-engineering-troubleshooting-symptom-filter-hint"
        >
          {ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_INDEX_FILTER_HINT}
        </p>
      </div>

      <p className={HELP_PAGE_TOC.referenceSearchMeta} data-testid="help-engineering-troubleshooting-symptom-filter-meta">
        {visibleRows.length} of {ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_ROWS.length} symptoms
      </p>

      {visibleRows.length === 0 ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="help-engineering-troubleshooting-symptom-empty"
        >
          No symptoms match this filter. Clear the search or try HTTP status codes such as 401 or 503.
        </p>
      ) : (
        <div className={HELP_PAGE_LAYOUT.tableWrap}>
          <table className={HELP_PAGE_LAYOUT.table}>
            <caption className="sr-only">Engineering troubleshooting symptom lookup</caption>
            <thead>
              <tr>
                <th className={HELP_PAGE_LAYOUT.tableHeadCell} scope="col">
                  Symptom
                </th>
                <th className={HELP_PAGE_LAYOUT.tableHeadCell} scope="col">
                  First check
                </th>
                <th className={HELP_PAGE_LAYOUT.tableHeadCell} scope="col">
                  Evidence to attach
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, index) => (
                <tr
                  key={row.symptom}
                  className={index % 2 === 0 ? HELP_PAGE_LAYOUT.tableRowOdd : HELP_PAGE_LAYOUT.tableRowEven}
                  data-testid="help-engineering-troubleshooting-symptom-row"
                >
                  <th className={HELP_PAGE_LAYOUT.tableBodyCell} scope="row">
                    <div className="flex flex-wrap items-center gap-2">
                      <SeverityTag severity={row.severity} />
                      <Link
                        className={cn(OPERATOR_LINK.inline, "font-medium")}
                        href={helpEngineeringTroubleshootingSymptomRunbookHrefFromSearch(
                          currentSearch,
                          row.runbookSectionId,
                          pathname,
                        )}
                        data-testid="help-engineering-troubleshooting-symptom-runbook-link"
                        onClick={(event) => {
                          event.preventDefault();
                          navigateToRunbookSection(row.runbookSectionId);
                        }}
                      >
                        {row.symptom}
                      </Link>
                    </div>
                  </th>
                  <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{row.firstCheck}</td>
                  <td className={HELP_PAGE_LAYOUT.tableBodyCell}>
                    <span>{row.evidenceToAttach}</span>
                    {row.escalationHref !== undefined ? (
                      <>
                        {" "}
                        <span className="text-al-text-secondary">→</span>{" "}
                        <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={row.escalationHref}>
                          {row.escalationDestinationLabel}
                        </Link>
                      </>
                    ) : (
                      <span className="text-al-text-secondary"> ({row.escalationDestinationLabel})</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
