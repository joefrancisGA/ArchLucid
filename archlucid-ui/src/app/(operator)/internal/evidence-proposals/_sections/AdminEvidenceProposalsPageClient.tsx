"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EvidenceProposalsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { readApiFailureMessage } from "@/lib/api-error";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  EVIDENCE_PROPOSALS_LOAD_UNEXPECTED_ERROR,
  EVIDENCE_PROPOSALS_PROMOTE_UNEXPECTED_ERROR,
} from "@/lib/evidence-proposals-page-copy";
import { INTERNAL_EVIDENCE_PROPOSALS_PATH } from "@/lib/internal-ops-route-paths";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

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
      const response = await fetch(
        "/api/proxy/v1/admin/evidence/proposals",
        mergeRegistrationScopeForProxy(),
      );

      if (!response.ok) {
        setError(await readApiFailureMessage(response));

        return;
      }

      const data = (await response.json()) as EvidenceProposalRow[];
      setRows(data);
    } catch {
      setError(EVIDENCE_PROPOSALS_LOAD_UNEXPECTED_ERROR);
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
      const response = await fetch(
        `/api/proxy/v1/admin/evidence/proposals/${resultId}/promote`,
        mergeRegistrationScopeForProxy({ method: "POST" }),
      );

      if (!response.ok) {
        setError(await readApiFailureMessage(response));

        return;
      }

      await load();
    } catch {
      setError(EVIDENCE_PROPOSALS_PROMOTE_UNEXPECTED_ERROR);
    } finally {
      setPromotingId(null);
    }
  };

  return (
    <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.sectionStack} data-testid="admin-evidence-proposals-page">
      <OperatorPageHeader
        navHref={INTERNAL_EVIDENCE_PROPOSALS_PATH}
        title="Evidence proposals"
        headingLevel="h1"
        subtitle="Review agent-suggested catalog entries from recent reviews and promote approved items into the tenant curated evidence catalog."
        actions={<PageContextualHelpButton />}
      />
      <EvidenceProposalsEvidenceOrientationStrip />
      {error !== null ? (
        <p
          role="alert"
          data-testid="admin-evidence-proposals-error"
          className={cn(
            "rounded-md border border-rose-600/40 bg-al-surface-raised p-2 text-al-text-primary dark:border-rose-800/50",
            OPERATOR_TYPOGRAPHY.body,
          )}
        >
          {error}
        </p>
      ) : null}

      {loading ? <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading proposals…</p> : null}

      {!loading && rows.length === 0 && error === null ? (
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
    </OperatorPageContainer>
  );
}
