"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableHeadRow,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { SeverityTag } from "@/components/ui/severity-tag";
import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { RagHealthSystemHealthVocabularyRail } from "@/components/RagHealthSystemHealthVocabularyRail";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { fetchAdminRagHealth, type AdminRagCorpusHealthItem } from "@/lib/rag-health-admin";

function formatUtc(iso: string | null): string {
  if (!iso) {
    return "—";
  }

  const parsed = new Date(iso);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

export function RagHealthAdminPageClient() {
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const isAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const [embeddingModelId, setEmbeddingModelId] = useState("");
  const [corpora, setCorpora] = useState<AdminRagCorpusHealthItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchAdminRagHealth();
      setEmbeddingModelId(response.embeddingModelId);
      setCorpora(response.corpora);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load RAG health.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorityLoading || !isAdmin) {
      return;
    }

    void refresh();
  }, [isAdmin, isAuthorityLoading, refresh]);

  if (isAuthorityLoading) {
    return <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading…</p>;
  }

  if (!isAdmin) {
    return (
      <p className={cn("text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
        This page requires tenant administrator access (AdminAuthority).
      </p>
    );
  }

  return (
    <div className="w-full max-w-[1440px] space-y-6" data-testid="rag-health-admin-page">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>RAG corpus health</h1>
            <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              Per-corpus chunk counts and last-indexed timestamps for this API host process. Embedding model:{" "}
              <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{embeddingModelId || "—"}</span>.
            </p>
          </div>
          <PageContextualHelpButton />
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-3" disabled={loading} onClick={() => void refresh()}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
      <RagHealthSystemHealthVocabularyRail currentSurfaceId="rag-health" />
{error ? (
        <p className={cn("text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.body)} role="alert">
          {error}
        </p>
      ) : null}

      <EnterpriseTable ariaLabel="RAG corpus health">
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow>
            <EnterpriseTableHeaderCell>Corpus</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Chunks</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Last indexed</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Embedding dim</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Stale</EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {corpora.map((row) => (
            <EnterpriseTableRow key={row.corpusKind}>
              <EnterpriseTableCell>{row.corpusKind}</EnterpriseTableCell>
              <EnterpriseTableCell>{row.chunkCount}</EnterpriseTableCell>
              <EnterpriseTableCell>{formatUtc(row.lastIndexedUtc)}</EnterpriseTableCell>
              <EnterpriseTableCell>{row.embeddingDimension}</EnterpriseTableCell>
              <EnterpriseTableCell>
                <SeverityTag
                  severity={row.isStale ? "High" : "Low"}
                  label={row.isStale ? "Stale" : "Fresh"}
                />
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </div>
  );
}
