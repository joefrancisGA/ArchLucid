"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type EvidenceProposalRow = {
  resultId: string;
  runId: string;
  agentType: string;
  proposedEvidenceJson: string;
  createdUtc: string;
  isPromoted: boolean;
};

export function AdminEvidenceProposalsPageClient() {
  const [rows, setRows] = useState<EvidenceProposalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promotingId, setPromotingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/proxy/v1/admin/evidence/proposals");

      if (!response.ok) {
        const text = await response.text().catch(() => "");

        throw new Error(`Failed to load proposals (HTTP ${response.status}). ${text.slice(0, 200)}`);
      }

      const data = (await response.json()) as EvidenceProposalRow[];
      setRows(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onPromote = async (resultId: string) => {
    setPromotingId(resultId);
    setError(null);

    try {
      const response = await fetch(`/api/proxy/v1/admin/evidence/proposals/${resultId}/promote`, {
        method: "POST",
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");

        throw new Error(`Promote failed (HTTP ${response.status}). ${text.slice(0, 200)}`);
      }

      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setPromotingId(null);
    }
  };

  return (
    <div className="w-full max-w-3xl space-y-6" data-testid="admin-evidence-proposals-page">
      <OperatorPageHeader
        title="Evidence proposals"
        headingLevel="h1"
        subtitle="Review agent-suggested catalog entries from recent reviews and promote approved items into the tenant curated evidence catalog."
        actions={<PageContextualHelpButton />}
      />
{error !== null ? (
        <p
          role="alert"
          className={cn(
            "rounded-md border border-rose-600/40 bg-al-surface-raised p-2 text-al-text-primary dark:border-rose-800/50",
            OPERATOR_TYPOGRAPHY.body,
          )}
        >
          {error}
        </p>
      ) : null}

      {loading ? <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading proposals…</p> : null}

      {!loading && rows.length === 0 ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No pending evidence proposals.</p>
      ) : null}

      <ul className="m-0 list-none space-y-3 p-0">
        {rows.map((row) => (
          <li key={row.resultId}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                  {row.agentType} · run {row.runId}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <pre
                  className={cn(
                    "max-h-48 overflow-auto rounded-md border border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-700 dark:bg-neutral-900",
                    OPERATOR_TYPOGRAPHY.micro,
                  )}
                >
                  {row.proposedEvidenceJson}
                </pre>
                <Button
                  type="button"
                  disabled={row.isPromoted || promotingId === row.resultId}
                  onClick={() => void onPromote(row.resultId)}
                >
                  {row.isPromoted
                    ? "Promoted"
                    : promotingId === row.resultId
                      ? "Promoting…"
                      : "Promote to catalog"}
                </Button>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
