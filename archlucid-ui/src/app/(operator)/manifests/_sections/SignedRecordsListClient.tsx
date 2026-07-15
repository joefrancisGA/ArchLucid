"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { listRunsByProjectPaged } from "@/lib/api";
import { coerceRunSummaryPaged } from "@/lib/operator-response-guards";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator-scope-storage";
import { projectIdFromScopeHeaders } from "@/lib/operator-resource-scope";
import { tryStaticDemoRunSummariesPaged } from "@/lib/operator-static-demo";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { enrichSignedRecordsListRows } from "./enrich-signed-records-list-rows";
import {
  SIGNED_RECORDS_LIST_EMPTY_BODY,
  SIGNED_RECORDS_LIST_EMPTY_PRIMARY_LABEL,
  SIGNED_RECORDS_LIST_EMPTY_SECONDARY_HREF,
  SIGNED_RECORDS_LIST_EMPTY_SECONDARY_LABEL,
  SIGNED_RECORDS_LIST_EMPTY_TITLE,
  SIGNED_RECORDS_LIST_OPEN_RECORD_ACTION,
  SIGNED_RECORDS_LIST_OPEN_REVIEW_ACTION,
  SIGNED_RECORDS_LIST_PAGE_SUBTITLE,
  SIGNED_RECORDS_LIST_PAGE_TITLE,
  SIGNED_RECORDS_LIST_TABLE_ACTIONS_COLUMN,
  SIGNED_RECORDS_LIST_TABLE_COMMITTED_COLUMN,
  SIGNED_RECORDS_LIST_TABLE_REVIEW_COLUMN,
  SIGNED_RECORDS_LIST_TABLE_VERSION_COLUMN,
} from "./signed-records-list-copy";
import { buildSignedRecordsListRowsFromRuns, type SignedRecordsListRow } from "./signed-records-list-row";

const SIGNED_RECORDS_LIST_PAGE_SIZE = 100;

function formatCommittedDate(committedUtc: string): string {
  const parsed = Date.parse(committedUtc);

  if (Number.isNaN(parsed)) {
    return "—";
  }

  return new Date(parsed).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function SignedRecordsListClient() {
  const [rows, setRows] = useState<readonly SignedRecordsListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    const scopeHeaders = getEffectiveBrowserProxyScopeHeaders();
    const projectId = projectIdFromScopeHeaders(scopeHeaders) ?? "default";

    try {
      const raw: unknown = await listRunsByProjectPaged(projectId, 1, SIGNED_RECORDS_LIST_PAGE_SIZE, {
        scopeHeaders,
        includeArchived: true,
      });
      const coerced = coerceRunSummaryPaged(raw, { page: 1 });

      if (!coerced.ok) {
        setRows([]);
        setLoadError(coerced.message);
        return;
      }

      let runs = coerced.value.items;
      const staticFallback = tryStaticDemoRunSummariesPaged(projectId);

      if (runs.length === 0 && staticFallback !== null) {
        runs = staticFallback.items;
      }

      const baseRows = buildSignedRecordsListRowsFromRuns(runs);
      const enrichedRows = await enrichSignedRecordsListRows(baseRows);

      setRows(enrichedRows);
    } catch (error: unknown) {
      setRows([]);
      setLoadError(error instanceof Error ? error.message : "Failed to load signed review records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const hasRows = rows.length > 0;

  return (
    <div className="w-full max-w-[1440px]">
      <OperatorPageHeader
        title={SIGNED_RECORDS_LIST_PAGE_TITLE}
        subtitle={SIGNED_RECORDS_LIST_PAGE_SUBTITLE}
        titleTestId="signed-records-list-page-title"
      />

      {loadError !== null ? (
        <p className={cn(OPERATOR_TYPOGRAPHY.body, "mb-4 text-al-danger")} role="alert">
          {loadError}
        </p>
      ) : null}

      {!loading && !hasRows && loadError === null ? (
        <EnterpriseCompactEmptyState
          title={SIGNED_RECORDS_LIST_EMPTY_TITLE}
          description={SIGNED_RECORDS_LIST_EMPTY_BODY}
          actions={[
            { label: SIGNED_RECORDS_LIST_EMPTY_PRIMARY_LABEL, href: "/reviews/new", variant: "primary" },
            {
              label: SIGNED_RECORDS_LIST_EMPTY_SECONDARY_LABEL,
              href: SIGNED_RECORDS_LIST_EMPTY_SECONDARY_HREF,
              variant: "outline",
            },
          ]}
        />
      ) : null}

      {loading ? (
        <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>Loading signed review records…</p>
      ) : null}

      {!loading && hasRows ? (
        <EnterpriseTable ariaLabel={SIGNED_RECORDS_LIST_PAGE_TITLE}>
          <EnterpriseTableHead>
            <EnterpriseTableHeadRow>
              <EnterpriseTableHeaderCell>{SIGNED_RECORDS_LIST_TABLE_REVIEW_COLUMN}</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>{SIGNED_RECORDS_LIST_TABLE_VERSION_COLUMN}</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>{SIGNED_RECORDS_LIST_TABLE_COMMITTED_COLUMN}</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>{SIGNED_RECORDS_LIST_TABLE_ACTIONS_COLUMN}</EnterpriseTableHeaderCell>
            </EnterpriseTableHeadRow>
          </EnterpriseTableHead>
          <EnterpriseTableBody>
            {rows.map((row) => (
              <EnterpriseTableRow key={row.runId}>
                <EnterpriseTableCell>
                  <Link href={row.reviewHref} className={OPERATOR_LINK.nav}>
                    {row.reviewTitle}
                  </Link>
                </EnterpriseTableCell>
                <EnterpriseTableCell>{row.manifestVersion}</EnterpriseTableCell>
                <EnterpriseTableCell>{formatCommittedDate(row.committedUtc)}</EnterpriseTableCell>
                <EnterpriseTableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={row.reviewHref}>{SIGNED_RECORDS_LIST_OPEN_REVIEW_ACTION}</Link>
                    </Button>
                    {row.signedRecordHref !== null ? (
                      <Button asChild variant="default" size="sm">
                        <Link href={row.signedRecordHref}>{SIGNED_RECORDS_LIST_OPEN_RECORD_ACTION}</Link>
                      </Button>
                    ) : null}
                  </div>
                </EnterpriseTableCell>
              </EnterpriseTableRow>
            ))}
          </EnterpriseTableBody>
        </EnterpriseTable>
      ) : null}
    </div>
  );
}
