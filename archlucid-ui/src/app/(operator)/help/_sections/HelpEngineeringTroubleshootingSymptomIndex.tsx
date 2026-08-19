"use client";

import Link from "next/link";
import { useState } from "react";

import { SeverityTag } from "@/components/ui/severity-tag";
import {
  ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_INDEX_FILTER_LABEL,
  ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_INDEX_TITLE,
  ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_ROWS,
} from "@/lib/engineering-troubleshooting-help-guide-content";
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
  const [filter, setFilter] = useState("");

  const visibleRows = ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_ROWS.filter((row) => {
    const haystack = `${row.symptom} ${row.firstCheck} ${row.evidenceToAttach} ${row.escalationDestinationLabel}`;

    return matchesSymptomFilter(filter, haystack);
  });

  return (
    <section
      aria-labelledby="help-engineering-troubleshooting-symptom-index-heading"
      className="space-y-3"
      data-testid="help-engineering-troubleshooting-symptom-index"
    >
      <h2
        id="help-engineering-troubleshooting-symptom-index-heading"
        className={cn("m-0", OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_INDEX_TITLE}
      </h2>

      <label className="block space-y-2">
        <span className={cn("sr-only", OPERATOR_TYPOGRAPHY.body)}>{ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_INDEX_FILTER_LABEL}</span>
        <input
          type="search"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder={ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_INDEX_FILTER_LABEL}
          className={HELP_PAGE_TOC.referenceSearchInput}
          data-testid="help-engineering-troubleshooting-symptom-filter"
        />
      </label>

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
                        href={`#${row.runbookSectionId}`}
                        data-testid="help-engineering-troubleshooting-symptom-runbook-link"
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
