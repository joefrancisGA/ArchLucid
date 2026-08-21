"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { RefreshButton } from "@/components/ui/refresh-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableHeadRow,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { EnterpriseTableSkeletonRows } from "@/components/ui/enterprise-table-skeleton-rows";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { AgentModelCatalogEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OperatorSectionLoadFailure } from "@/components/operator/OperatorSectionLoadFailure";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  fetchAdminAgentModelCatalog,
  importAdminAgentModelCatalogFaithfulnessHarness,
  recordAdminAgentModelCatalogEvaluation,
  type AgentModelCatalogRow,
} from "@/lib/agent-model-catalog-ops";
import {
  AGENT_MODEL_CATALOG_PAGE_LEAD,
  AGENT_MODEL_CATALOG_PAGE_TITLE,
} from "@/lib/agent-model-catalog-page-copy";
import { INTERNAL_AGENT_MODEL_CATALOG_PATH } from "@/lib/internal-ops-route-paths";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

export function AgentModelCatalogAdminPageClient() {
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const isAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const [rows, setRows] = useState<AgentModelCatalogRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [recordingAliasId, setRecordingAliasId] = useState<string | null>(null);
  const [importingAliasId, setImportingAliasId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const next = await fetchAdminAgentModelCatalog();
      setRows(next);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load agent model catalog.");
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

  async function handleRecordNotEvaluated(aliasId: string, taskType: string) {
    setRecordingAliasId(aliasId);

    try {
      await recordAdminAgentModelCatalogEvaluation(aliasId, taskType, {
        evaluationState: "NotEvaluated",
        evidenceJson: null,
      });
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to record evaluation.");
    } finally {
      setRecordingAliasId(null);
    }
  }

  async function handleImportHarness(aliasId: string) {
    setImportingAliasId(aliasId);

    try {
      await importAdminAgentModelCatalogFaithfulnessHarness(aliasId);
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to import faithfulness harness.");
    } finally {
      setImportingAliasId(null);
    }
  }

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
    <div className={cn("w-full max-w-[1440px]", OPERATOR_LAYOUT.sectionStack)} data-testid="agent-model-catalog-page">
      <OperatorPageHeader
        navHref={INTERNAL_AGENT_MODEL_CATALOG_PATH}
        headingLevel="h1"
        title={AGENT_MODEL_CATALOG_PAGE_TITLE}
        subtitle={AGENT_MODEL_CATALOG_PAGE_LEAD}
        actions={
          <>
            <RefreshButton busy={loading} onClick={() => void refresh()} />
            <PageContextualHelpButton />
          </>
        }
      />

      <AgentModelCatalogEvidenceOrientationStrip />

      {error ? (
        <OperatorSectionLoadFailure
          message={error}
          retryLabel="Reload catalog"
          retrying={loading}
          testId="agent-model-catalog-load-failure"
          onRetry={() => void refresh()}
        />
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Catalog entries</CardTitle>
        </CardHeader>
        <CardContent className={cn("overflow-x-auto", OPERATOR_TYPOGRAPHY.body)}>
          <EnterpriseTable ariaLabel="Agent model catalog entries">
            <EnterpriseTableHead>
              <EnterpriseTableHeadRow>
                <EnterpriseTableHeaderCell>Alias</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Lifecycle</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Structured output</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Deployment</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Evaluations</EnterpriseTableHeaderCell>
              </EnterpriseTableHeadRow>
            </EnterpriseTableHead>
            <EnterpriseTableBody>
              {loading ? <EnterpriseTableSkeletonRows columns={5} rows={4} /> : null}
              {!loading
                ? rows.map((row) => (
                    <EnterpriseTableRow key={row.aliasId}>
                      <EnterpriseTableCell>{row.aliasId}</EnterpriseTableCell>
                      <EnterpriseTableCell>{row.lifecycleStatus}</EnterpriseTableCell>
                      <EnterpriseTableCell>{row.structuredOutputLevel}</EnterpriseTableCell>
                      <EnterpriseTableCell>{row.deploymentName ?? " — "}</EnterpriseTableCell>
                      <EnterpriseTableCell>
                        <div className="space-y-2">
                          {row.evaluations.length === 0 ? (
                            <p className="m-0 text-al-text-secondary">No task evaluations recorded.</p>
                          ) : (
                            row.evaluations.map((evaluation) => (
                              <p key={`${row.aliasId}-${evaluation.taskType}`} className="m-0">
                                {evaluation.taskType}: {evaluation.evaluationState}
                              </p>
                            ))
                          )}
                          {row.approvedTaskTypes.slice(0, 1).map((taskType) => (
                            <div key={`${row.aliasId}-actions`} className="flex flex-wrap gap-2">
                              <Button
                                key={`${row.aliasId}-import-harness`}
                                type="button"
                                size="sm"
                                variant="primary"
                                disabled={importingAliasId === row.aliasId}
                                onClick={() => void handleImportHarness(row.aliasId)}
                              >
                                Import faithfulness harness
                              </Button>
                              <Button
                                key={`${row.aliasId}-record-${taskType}`}
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={recordingAliasId === row.aliasId}
                                onClick={() => void handleRecordNotEvaluated(row.aliasId, taskType)}
                              >
                                Mark {taskType} not evaluated
                              </Button>
                            </div>
                          ))}
                        </div>
                      </EnterpriseTableCell>
                    </EnterpriseTableRow>
                  ))
                : null}
            </EnterpriseTableBody>
          </EnterpriseTable>
        </CardContent>
      </Card>
    </div>
  );
}
