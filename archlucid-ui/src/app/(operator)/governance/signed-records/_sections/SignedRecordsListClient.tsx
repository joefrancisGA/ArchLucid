"use client";

import { useCallback, useEffect, useState } from "react";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { SignedRecordsReviewDetailVocabularyRail } from "@/components/SignedRecordsReviewDetailVocabularyRail";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { listRunsByProjectPaged } from "@/lib/api";
import { coerceRunSummaryPaged } from "@/lib/operator-response-guards";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator-scope-storage";
import { projectIdFromScopeHeaders } from "@/lib/operator-resource-scope";
import { tryStaticDemoRunSummariesPaged } from "@/lib/operator-static-demo";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { enrichSignedRecordsListRows } from "./enrich-signed-records-list-rows";
import { SignedRecordsListTableDeferred } from "./signed-records-list-deferred-chunks";
import {
  SIGNED_RECORDS_LIST_EMPTY_BODY,
  SIGNED_RECORDS_LIST_EMPTY_PRIMARY_LABEL,
  SIGNED_RECORDS_LIST_EMPTY_SECONDARY_HREF,
  SIGNED_RECORDS_LIST_EMPTY_SECONDARY_LABEL,
  SIGNED_RECORDS_LIST_EMPTY_TITLE,
  SIGNED_RECORDS_LIST_PAGE_SUBTITLE,
  SIGNED_RECORDS_LIST_PAGE_TITLE,
} from "./signed-records-list-copy";
import { buildSignedRecordsListRowsFromRuns, type SignedRecordsListRow } from "./signed-records-list-row";

const SIGNED_RECORDS_LIST_PAGE_SIZE = 100;

export default function SignedRecordsListClient() {
  const [rows, setRows] = useState<readonly SignedRecordsListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryingRunId, setRetryingRunId] = useState<string | null>(null);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    const scopeHeaders = getEffectiveBrowserProxyScopeHeaders();
    const projectId = projectIdFromScopeHeaders(scopeHeaders) ?? "default";

    try {
      const raw: unknown = await listRunsByProjectPaged(projectId, 1, SIGNED_RECORDS_LIST_PAGE_SIZE, {
        cursor: "",
        scopeHeaders,
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

  const retryRow = useCallback(async (runId: string) => {
    const existingRow = rows.find((row) => row.runId === runId);

    if (existingRow === undefined) {
      return;
    }

    setRetryingRunId(runId);

    try {
      const [enrichedRow] = await enrichSignedRecordsListRows([existingRow]);

      setRows((currentRows) => currentRows.map((row) => (row.runId === runId ? enrichedRow : row)));
    } finally {
      setRetryingRunId(null);
    }
  }, [rows]);

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
        actions={<PageContextualHelpButton />}
      />
      <SignedRecordsReviewDetailVocabularyRail currentSurfaceId="signed-records" />
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
            { label: SIGNED_RECORDS_LIST_EMPTY_PRIMARY_LABEL, href: "/architecture/reviews/new", variant: "primary" },
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
        <SignedRecordsListTableDeferred
          rows={rows}
          retryingRunId={retryingRunId}
          onRetryRow={(runId) => {
            void retryRow(runId);
          }}
        />
      ) : null}
    </div>
  );
}
