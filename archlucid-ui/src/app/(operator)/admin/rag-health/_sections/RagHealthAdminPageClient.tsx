"use client";

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
    return <p className="text-sm text-neutral-500">Loading…</p>;
  }

  if (!isAdmin) {
    return (
      <p className="text-sm text-rose-800 dark:text-rose-200" role="alert">
        This page requires tenant administrator access (AdminAuthority).
      </p>
    );
  }

  return (
    <div className="w-full max-w-[1440px] space-y-6" data-testid="rag-health-admin-page">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">RAG corpus health</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Per-corpus chunk counts and last-indexed timestamps for this API host process. Embedding model:{" "}
          <span className="font-mono">{embeddingModelId || "—"}</span>.
        </p>
        <Button type="button" variant="outline" size="sm" className="mt-3" disabled={loading} onClick={() => void refresh()}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-rose-700 dark:text-rose-300" role="alert">
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
