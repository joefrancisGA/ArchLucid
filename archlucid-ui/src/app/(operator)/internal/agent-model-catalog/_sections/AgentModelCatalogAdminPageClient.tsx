"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { HelpLazyDetails } from "@/components/help/HelpLazyDetails";
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
import {
  AGENT_MODEL_CATALOG_CLAIM_DISCIPLINE,
  AGENT_MODEL_CATALOG_PRIMARY_CONTENT_ID,
  AGENT_MODEL_CATALOG_SKIP_LINK_LABEL,
} from "@/lib/agent-model-catalog-evidence-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { AgentModelCatalogBreadcrumb } from "./AgentModelCatalogBreadcrumb";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
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
  AGENT_MODEL_CATALOG_ACCESS_DENIED_DESCRIPTION,
  AGENT_MODEL_CATALOG_ACCESS_DENIED_TITLE,
  AGENT_MODEL_CATALOG_EMPTY_DESCRIPTION,
  AGENT_MODEL_CATALOG_EMPTY_TITLE,
  AGENT_MODEL_CATALOG_PAGE_LEAD,
  AGENT_MODEL_CATALOG_PAGE_TITLE,
} from "@/lib/agent-model-catalog-page-copy";
import { INTERNAL_AGENT_MODEL_CATALOG_PATH } from "@/lib/internal-ops-route-paths";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

function formatEvaluationSummary(row: AgentModelCatalogRow): string {
  if (row.evaluations.length === 0) {
    return "No evaluations";
  }

  const recorded = row.evaluations.filter((evaluation) => evaluation.evaluationState !== "NotEvaluated").length;

  return `${recorded}/${row.evaluations.length} recorded`;
}

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
      <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.sectionStack} data-testid="agent-model-catalog-access-denied">
        <EnterpriseCompactEmptyState
          role="alert"
          title={AGENT_MODEL_CATALOG_ACCESS_DENIED_TITLE}
          description={AGENT_MODEL_CATALOG_ACCESS_DENIED_DESCRIPTION}
          testId="agent-model-catalog-access-denied-panel"
        />
      </OperatorPageContainer>
    );
  }

  return (
    <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.sectionStack} data-testid="agent-model-catalog-page">
      <a
        href={`#${AGENT_MODEL_CATALOG_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {AGENT_MODEL_CATALOG_SKIP_LINK_LABEL}
      </a>

      <OperatorPageHeader
        navHref={INTERNAL_AGENT_MODEL_CATALOG_PATH}
        headingLevel="h1"
        title={AGENT_MODEL_CATALOG_PAGE_TITLE}
        subtitle={AGENT_MODEL_CATALOG_PAGE_LEAD}
        breadcrumb={<AgentModelCatalogBreadcrumb />}
        claimDiscipline={AGENT_MODEL_CATALOG_CLAIM_DISCIPLINE}
        claimDisciplineTestId="agent-model-catalog-claim-discipline"
        actions={
          <>
            <RefreshButton busy={loading} onClick={() => void refresh()} />
            <PageContextualHelpButton />
          </>
        }
      />

      <main
        id={AGENT_MODEL_CATALOG_PRIMARY_CONTENT_ID}
        className={cn("min-w-0 space-y-4 scroll-mt-24")}
        data-testid="agent-model-catalog-primary-content"
      >
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
          {!loading && rows.length === 0 ? (
            <EnterpriseCompactEmptyState
              title={AGENT_MODEL_CATALOG_EMPTY_TITLE}
              description={AGENT_MODEL_CATALOG_EMPTY_DESCRIPTION}
              testId="agent-model-catalog-empty-state"
            />
          ) : (
            <EnterpriseTable ariaLabel="Agent model catalog entries">
              <EnterpriseTableHead>
                <EnterpriseTableHeadRow>
                  <EnterpriseTableHeaderCell>Alias</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Lifecycle</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Structured output</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Deployment</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Evaluations</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
                </EnterpriseTableHeadRow>
              </EnterpriseTableHead>
              <EnterpriseTableBody>
                {loading ? <EnterpriseTableSkeletonRows columns={6} rows={4} /> : null}
                {!loading
                  ? rows.map((row) => (
                      <EnterpriseTableRow key={row.aliasId}>
                        <EnterpriseTableCell className="font-mono text-xs">{row.aliasId}</EnterpriseTableCell>
                        <EnterpriseTableCell>{row.lifecycleStatus}</EnterpriseTableCell>
                        <EnterpriseTableCell>{row.structuredOutputLevel}</EnterpriseTableCell>
                        <EnterpriseTableCell>{row.deploymentName ?? " — "}</EnterpriseTableCell>
                        <EnterpriseTableCell>
                          <HelpLazyDetails
                            summary={formatEvaluationSummary(row)}
                            data-testid={`agent-model-catalog-evaluations-${row.aliasId}`}
                          >
                            {row.evaluations.length === 0 ? (
                              <p className="m-0 text-al-text-secondary">No task evaluations recorded.</p>
                            ) : (
                              <ul className="m-0 list-disc space-y-1 ps-5">
                                {row.evaluations.map((evaluation) => (
                                  <li key={`${row.aliasId}-${evaluation.taskType}`}>
                                    {evaluation.taskType}: {evaluation.evaluationState}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </HelpLazyDetails>
                        </EnterpriseTableCell>
                        <EnterpriseTableCell>
                          {row.approvedTaskTypes.slice(0, 1).map((taskType) => (
                            <div key={`${row.aliasId}-actions`} className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="primary"
                                disabled={importingAliasId === row.aliasId}
                                onClick={() => void handleImportHarness(row.aliasId)}
                              >
                                Import harness
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={recordingAliasId === row.aliasId}
                                onClick={() => void handleRecordNotEvaluated(row.aliasId, taskType)}
                              >
                                Mark not evaluated
                              </Button>
                            </div>
                          ))}
                        </EnterpriseTableCell>
                      </EnterpriseTableRow>
                    ))
                  : null}
              </EnterpriseTableBody>
            </EnterpriseTable>
          )}
        </CardContent>
      </Card>
      </main>
    </OperatorPageContainer>
  );
}
