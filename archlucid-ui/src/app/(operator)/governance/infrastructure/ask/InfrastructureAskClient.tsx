"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { CopyScopedOperatorLinkButton } from "@/components/CopyScopedOperatorLinkButton";
import { InfraEvidenceRecentScopeStrip } from "@/components/infra-evidence/InfraEvidenceRecentScopeStrip";
import { WorkbenchAuditLineageStatus } from "@/components/infra-evidence/WorkbenchAuditLineageStatus";
import { LayerHeader } from "@/components/LayerHeader";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { formatInfraEvidenceAskScopeStack } from "@/lib/infra-evidence/infra-evidence-ask-scope-summary";
import {
  formatInfraEvidenceAskApiError,
  submitInfraEvidenceAsk,
} from "@/lib/infra-evidence/infra-evidence-ask-api";
import { buildAuditEvidenceLineageUiPath, buildResourceHubDiagramsWorkbenchHref, resolveInfraEvidenceAskCitationLink } from "@/lib/infra-evidence/infra-evidence-ask-citations";
import { formatResourceHubTabViewLabel } from "@/lib/infra-evidence/infra-evidence-hub-tab-labels";
import { buildDiagramReconcileWorkbenchHref } from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-filter-url";
import {
  parseResourceExplorerCloudResourceIdFromSearch,
  parseResourceHubQueryValueFromSearch,
  buildInfrastructureAskHref,
  buildResourceHubOverviewHref,
  resourceExplorerFilterHrefFromSearch,
  resourceHubFilterHrefFromSearch,
  resolveResourceHubTabFromAskScope,
  resolveResourceHubWorkbenchTabFromAskScope,
  formatResourceHubTabViewLabelFromAskScope,
  RESOURCE_EXPLORER_CLOUD_RESOURCE_ID_PARAM,
  RESOURCE_EXPLORER_WORK_QUEUE_PARAM,
  RESOURCE_HUB_ASSESSMENT_ID_PARAM,
  RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM,
  RESOURCE_HUB_CONTROL_ID_PARAM,
  RESOURCE_HUB_CORRESPONDENCE_ID_PARAM,
  RESOURCE_HUB_DIFF_ID_PARAM,
  RESOURCE_HUB_FINDING_ID_PARAM,
  RESOURCE_HUB_INSTANCE_ID_PARAM,
  RESOURCE_HUB_RUN_ID_PARAM,
  RESOURCE_HUB_SEED_NODE_ID_PARAM,
  RESOURCE_HUB_SNAPSHOT_ID_PARAM,
  RESOURCE_HUB_TAB_PARAM,
  parseAskHubTabOriginFromSearch,
} from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import {
  formatCloudResourceExplorerWorkQueueLabel,
  formatResourceHubTabViewLabelFromExplorerWorkQueue,
  parseResourceExplorerWorkQueueFromSearch,
  resolveResourceHubTabFromExplorerWorkQueue,
} from "@/lib/infra-evidence/infra-evidence-explorer-work-queue";
import { buildTerraformWorkbenchHref } from "@/lib/infra-evidence/infra-evidence-terraform-filter-url";
import { buildInfraEvidenceAuditControlOptions } from "@/lib/infra-evidence/infra-evidence-audit-control-options";
import { formatInfraEvidenceRecentScopeLabel } from "@/lib/infra-evidence/infra-evidence-recent-scope-label";
import { recordInfraEvidenceRecentScope } from "@/lib/infra-evidence/infra-evidence-recent-scope";
import {
  hasStaleInfraEvidenceAuditUrlParams,
  parseInfraEvidenceWorkbenchAuditScopeFromSearch,
} from "@/lib/infra-evidence/infra-evidence-workbench-hub-scope";
import { useInfraEvidenceResourceHubAuditLineage } from "@/hooks/use-infra-evidence-resource-hub-audit-lineage";
import type { CloudResourceAuditLineageMatch } from "@/lib/infra-evidence/infra-evidence-hub-types";
import {
  buildDriftWorkbenchHref,
  buildRemediationWorkbenchHref,
} from "@/lib/infra-evidence/infra-evidence-workbench-url";
import {
  INFRA_EVIDENCE_ASK_CANNED_QUESTIONS,
  type InfraEvidenceAskResponse,
} from "@/lib/infra-evidence/infra-evidence-ask-types";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type InfrastructureAskTurn = {
  readonly question: string;
  readonly response: InfraEvidenceAskResponse;
};

export function InfrastructureAskClient() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const cloudResourceId = parseResourceExplorerCloudResourceIdFromSearch(
    searchParams.get(RESOURCE_EXPLORER_CLOUD_RESOURCE_ID_PARAM),
  );
  const runId = parseResourceHubQueryValueFromSearch(searchParams.get(RESOURCE_HUB_RUN_ID_PARAM));
  const snapshotId = parseResourceHubQueryValueFromSearch(searchParams.get(RESOURCE_HUB_SNAPSHOT_ID_PARAM));
  const diffId = parseResourceHubQueryValueFromSearch(searchParams.get(RESOURCE_HUB_DIFF_ID_PARAM));
  const findingId = parseResourceHubQueryValueFromSearch(searchParams.get(RESOURCE_HUB_FINDING_ID_PARAM));
  const instanceId = parseResourceHubQueryValueFromSearch(searchParams.get(RESOURCE_HUB_INSTANCE_ID_PARAM));
  const correspondenceId = parseResourceHubQueryValueFromSearch(
    searchParams.get(RESOURCE_HUB_CORRESPONDENCE_ID_PARAM),
  );
  const assessmentId = parseResourceHubQueryValueFromSearch(searchParams.get(RESOURCE_HUB_ASSESSMENT_ID_PARAM));
  const auditEvidenceSnapshotId = parseResourceHubQueryValueFromSearch(
    searchParams.get(RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM),
  );
  const controlId = parseResourceHubQueryValueFromSearch(searchParams.get(RESOURCE_HUB_CONTROL_ID_PARAM));
  const seedNodeId = parseResourceHubQueryValueFromSearch(searchParams.get(RESOURCE_HUB_SEED_NODE_ID_PARAM));
  const hubTabOrigin = parseAskHubTabOriginFromSearch(searchParams.get(RESOURCE_HUB_TAB_PARAM));
  const workQueue = parseResourceExplorerWorkQueueFromSearch(searchParams.get(RESOURCE_EXPLORER_WORK_QUEUE_PARAM));
  const workQueueLabel = formatCloudResourceExplorerWorkQueueLabel(workQueue);
  const auditScope = useMemo(() => parseInfraEvidenceWorkbenchAuditScopeFromSearch(searchParams), [searchParams]);
  const hasStaleAuditUrlParams = useMemo(
    () => hasStaleInfraEvidenceAuditUrlParams(searchParams),
    [searchParams],
  );
  const { hub: resourceHub } = useInfraEvidenceResourceHubAuditLineage(cloudResourceId, snapshotId);
  const auditControlOptions = useMemo(
    () => buildInfraEvidenceAuditControlOptions(resourceHub),
    [resourceHub],
  );

  const [question, setQuestion] = useState("");
  const [useSimulator, setUseSimulator] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [history, setHistory] = useState<InfrastructureAskTurn[]>([]);

  const citationContext = useMemo(
    () => ({
      cloudResourceId: cloudResourceId.length > 0 ? cloudResourceId : null,
      snapshotId: snapshotId.length > 0 ? snapshotId : null,
      diffId: diffId.length > 0 ? diffId : null,
      findingId: findingId.length > 0 ? findingId : null,
      correspondenceId: correspondenceId.length > 0 ? correspondenceId : null,
      runId: runId.length > 0 ? runId : null,
      assessmentId: assessmentId.length > 0 ? assessmentId : null,
      auditEvidenceSnapshotId: auditEvidenceSnapshotId.length > 0 ? auditEvidenceSnapshotId : null,
      controlId: controlId.length > 0 ? controlId : null,
    }),
    [
      assessmentId,
      auditEvidenceSnapshotId,
      cloudResourceId,
      controlId,
      correspondenceId,
      diffId,
      findingId,
      runId,
      snapshotId,
    ],
  );

  const contextSummary = useMemo(
    () =>
      formatInfraEvidenceAskScopeStack({
        cloudResourceId,
        snapshotId,
        diffId,
        findingId,
        instanceId,
        correspondenceId,
        assessmentId,
        auditEvidenceSnapshotId,
        controlId,
        workQueue,
      }),
    [
      assessmentId,
      auditEvidenceSnapshotId,
      cloudResourceId,
      controlId,
      correspondenceId,
      diffId,
      findingId,
      instanceId,
      snapshotId,
      workQueue,
    ],
  );

  const hubBackLinkTab = useMemo(() => {
    const scopeTab = resolveResourceHubTabFromAskScope({
      hubTab: hubTabOrigin,
      findingId,
      instanceId,
      diffId,
      assessmentId,
      auditEvidenceSnapshotId,
      controlId,
      correspondenceId,
    });

    if (scopeTab != null) {
      return scopeTab;
    }

    return resolveResourceHubTabFromExplorerWorkQueue(workQueue);
  }, [assessmentId, auditEvidenceSnapshotId, controlId, correspondenceId, diffId, findingId, hubTabOrigin, instanceId, workQueue]);

  const askScopeHubTab = useMemo(
    () =>
      resolveResourceHubWorkbenchTabFromAskScope({
        hubTab: hubTabOrigin,
        findingId,
        instanceId,
        diffId,
        correspondenceId,
      }),
    [correspondenceId, diffId, findingId, hubTabOrigin, instanceId],
  );

  const hasAuditLineageScope = useMemo(
    () =>
      assessmentId.length > 0
      && auditEvidenceSnapshotId.length > 0
      && controlId.length > 0,
    [assessmentId, auditEvidenceSnapshotId, controlId],
  );

  const auditHubTabBackLinkHref = useMemo(() => {
    if (cloudResourceId.length === 0 || !hasAuditLineageScope) {
      return null;
    }

    if (askScopeHubTab == null || askScopeHubTab === "audit") {
      return null;
    }

    return resourceHubFilterHrefFromSearch(cloudResourceId, "", {
      tab: "audit",
      snapshotId: snapshotId.length > 0 ? snapshotId : undefined,
      runId: runId.length > 0 ? runId : undefined,
      assessmentId,
      auditEvidenceSnapshotId,
      controlId,
    });
  }, [
    askScopeHubTab,
    assessmentId,
    auditEvidenceSnapshotId,
    cloudResourceId,
    controlId,
    hasAuditLineageScope,
    runId,
    snapshotId,
  ]);

  const workQueueScopedHubTabLabel = useMemo(() => {
    if (workQueue === "all" || askScopeHubTab != null) {
      return null;
    }

    return formatResourceHubTabViewLabelFromExplorerWorkQueue(workQueue);
  }, [askScopeHubTab, workQueue]);

  const askScopeHubTabLabel = useMemo(
    () => formatResourceHubTabViewLabelFromAskScope(askScopeHubTab),
    [askScopeHubTab],
  );

  const resourceHubBackLinkLabel = askScopeHubTabLabel
    ?? workQueueScopedHubTabLabel
    ?? (
      assessmentId.length > 0
      && auditEvidenceSnapshotId.length > 0
      && controlId.length > 0
        ? formatResourceHubTabViewLabel("audit")
        : "Open resource evidence hub"
    );

  const workbenchAuditContext = useMemo(() => {
    if (
      assessmentId.length === 0
      || auditEvidenceSnapshotId.length === 0
      || controlId.length === 0
    ) {
      return undefined;
    }

    return {
      assessmentId,
      auditEvidenceSnapshotId,
      controlId,
    };
  }, [assessmentId, auditEvidenceSnapshotId, controlId]);

  const driftWorkbenchBackLinkHref = useMemo(() => {
    if (diffId.length === 0) {
      return null;
    }

    return buildDriftWorkbenchHref({
      diffId,
      snapshotId: snapshotId.length > 0 ? snapshotId : null,
      cloudResourceId: cloudResourceId.length > 0 ? cloudResourceId : null,
      assessmentId: workbenchAuditContext?.assessmentId ?? null,
      auditEvidenceSnapshotId: workbenchAuditContext?.auditEvidenceSnapshotId ?? null,
      controlId: workbenchAuditContext?.controlId ?? null,
    });
  }, [cloudResourceId, diffId, snapshotId, workbenchAuditContext]);

  const terraformWorkbenchBackLinkHref = useMemo(() => {
    if (hubTabOrigin !== "terraform" || cloudResourceId.length === 0) {
      return null;
    }

    return buildTerraformWorkbenchHref({
      cloudResourceId,
      snapshotId: snapshotId.length > 0 ? snapshotId : null,
      assessmentId: workbenchAuditContext?.assessmentId ?? null,
      auditEvidenceSnapshotId: workbenchAuditContext?.auditEvidenceSnapshotId ?? null,
      controlId: workbenchAuditContext?.controlId ?? null,
    });
  }, [cloudResourceId, hubTabOrigin, snapshotId, workbenchAuditContext]);

  const diagramReconcileBackLinkHref = useMemo(() => {
    if (correspondenceId.length === 0) {
      return null;
    }

    return buildDiagramReconcileWorkbenchHref({
      runId: runId.length > 0 ? runId : null,
      snapshotId: snapshotId.length > 0 ? snapshotId : null,
      correspondenceId,
      cloudResourceId: cloudResourceId.length > 0 ? cloudResourceId : null,
      assessmentId: workbenchAuditContext?.assessmentId ?? null,
      auditEvidenceSnapshotId: workbenchAuditContext?.auditEvidenceSnapshotId ?? null,
      controlId: workbenchAuditContext?.controlId ?? null,
    });
  }, [cloudResourceId, correspondenceId, runId, snapshotId, workbenchAuditContext]);

  const inventoryDiagramsBackLinkHref = useMemo(() => {
    if (snapshotId.length === 0) {
      return null;
    }

    return buildResourceHubDiagramsWorkbenchHref(
      snapshotId,
      cloudResourceId.length > 0 ? cloudResourceId : null,
      seedNodeId.length > 0 ? seedNodeId : null,
      workbenchAuditContext,
    );
  }, [cloudResourceId, seedNodeId, snapshotId, workbenchAuditContext]);

  const remediationFactoryBackLinkHref = useMemo(() => {
    if (findingId.length === 0 && instanceId.length === 0 && correspondenceId.length === 0) {
      return null;
    }

    return buildRemediationWorkbenchHref({
      cloudResourceId: cloudResourceId.length > 0 ? cloudResourceId : null,
      findingId: findingId.length > 0 ? findingId : null,
      instanceId: instanceId.length > 0 ? instanceId : null,
      correspondenceId: correspondenceId.length > 0 ? correspondenceId : null,
      runId: runId.length > 0 ? runId : null,
      snapshotId: snapshotId.length > 0 ? snapshotId : null,
      assessmentId: workbenchAuditContext?.assessmentId ?? null,
      auditEvidenceSnapshotId: workbenchAuditContext?.auditEvidenceSnapshotId ?? null,
      controlId: workbenchAuditContext?.controlId ?? null,
    });
  }, [cloudResourceId, correspondenceId, findingId, instanceId, runId, snapshotId, workbenchAuditContext]);

  const auditLineageBackLinkHref = useMemo(() => {
    if (
      assessmentId.length === 0
      || auditEvidenceSnapshotId.length === 0
      || controlId.length === 0
    ) {
      return null;
    }

    return buildAuditEvidenceLineageUiPath(assessmentId, auditEvidenceSnapshotId, controlId);
  }, [assessmentId, auditEvidenceSnapshotId, controlId]);

  const ask = useCallback(async (nextQuestion: string) => {
    const trimmed = nextQuestion.trim();

    if (trimmed.length === 0) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitInfraEvidenceAsk({
        question: trimmed,
        cloudResourceId: cloudResourceId.length > 0 ? cloudResourceId : null,
        runId: runId.length > 0 ? runId : null,
        snapshotId: snapshotId.length > 0 ? snapshotId : null,
        diffId: diffId.length > 0 ? diffId : null,
        assessmentId: assessmentId.length > 0 ? assessmentId : null,
        auditEvidenceSnapshotId: auditEvidenceSnapshotId.length > 0 ? auditEvidenceSnapshotId : null,
        controlId: controlId.length > 0 ? controlId : null,
        useSimulator,
      });
      setHistory((current) => [...current, { question: trimmed, response: result }]);
      setQuestion("");
    } catch (error: unknown) {
      setSubmitError(formatInfraEvidenceAskApiError(error));
    } finally {
      setSubmitting(false);
    }
  }, [
    assessmentId,
    auditEvidenceSnapshotId,
    cloudResourceId,
    controlId,
    diffId,
    runId,
    snapshotId,
    useSimulator,
  ]);

  const onAuditControlChange = useCallback((match: CloudResourceAuditLineageMatch) => {
    const nextHref = buildInfrastructureAskHref({
      cloudResourceId: cloudResourceId.length > 0 ? cloudResourceId : undefined,
      snapshotId: snapshotId.length > 0 ? snapshotId : undefined,
      runId: runId.length > 0 ? runId : undefined,
      diffId: diffId.length > 0 ? diffId : undefined,
      findingId: findingId.length > 0 ? findingId : undefined,
      instanceId: instanceId.length > 0 ? instanceId : undefined,
      correspondenceId: correspondenceId.length > 0 ? correspondenceId : undefined,
      hubTab: hubTabOrigin != null && hubTabOrigin.length > 0 ? hubTabOrigin : undefined,
      workQueue: workQueue !== "all" ? workQueue : undefined,
      assessmentId: match.assessmentId,
      auditEvidenceSnapshotId: match.auditEvidenceSnapshotId,
      controlId: match.controlId,
    });
    router.replace(nextHref);
  }, [
    cloudResourceId,
    correspondenceId,
    diffId,
    findingId,
    hubTabOrigin,
    instanceId,
    router,
    runId,
    snapshotId,
    workQueue,
  ]);

  useEffect(() => {
    if (contextSummary == null) {
      return;
    }

    const href = searchParams.toString().length > 0
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
    const recentScopeLabel = formatInfraEvidenceRecentScopeLabel({
      surface: "ask",
      cloudResourceId,
      resourceDisplayName: resourceHub?.externalResourceId?.split("/").pop(),
      externalResourceId: resourceHub?.externalResourceId,
      snapshotId,
      controlNumber: resourceHub?.auditLineageLink.controlNumber,
      controlTitle: resourceHub?.auditLineageLink.controlTitle,
      controlId: controlId.length > 0 ? controlId : resourceHub?.auditLineageLink.controlId,
      workQueueLabel: workQueue !== "all" ? workQueueLabel : null,
      diffId,
      findingId,
      instanceId,
      correspondenceId,
    });

    if (recentScopeLabel == null) {
      return;
    }

    recordInfraEvidenceRecentScope({
      label: recentScopeLabel,
      href,
    });
  }, [
    cloudResourceId,
    contextSummary,
    controlId,
    correspondenceId,
    diffId,
    findingId,
    instanceId,
    pathname,
    resourceHub,
    searchParams,
    snapshotId,
    workQueue,
    workQueueLabel,
  ]);

  useEffect(() => {
    setQuestion("");
    setHistory([]);
    setSubmitError(null);
  }, [cloudResourceId, correspondenceId, diffId, findingId, instanceId, runId, seedNodeId, snapshotId, assessmentId, auditEvidenceSnapshotId, controlId]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
      <LayerHeader pageKey="infrastructure-ask" />

      <div className="flex flex-wrap items-center justify-end gap-2">
        {auditScope == null ? (
          <CopyScopedOperatorLinkButton testId="infra-ask-copy-scoped-link" />
        ) : null}
      </div>

      {cloudResourceId.length > 0 && (
        auditScope != null
        || resourceHub?.auditLineageLink.available === false
        || hasStaleAuditUrlParams
      ) ? (
        <WorkbenchAuditLineageStatus
          auditScope={auditScope}
          hub={resourceHub}
          cloudResourceId={cloudResourceId}
          currentSearch={searchParams.toString()}
          snapshotId={snapshotId}
          runId={runId}
          hasStaleAuditUrlParams={hasStaleAuditUrlParams}
          auditControlOptions={auditControlOptions}
          onAuditControlChange={onAuditControlChange}
          provenanceTestId="infra-ask-audit-provenance"
          unavailableTestId="infra-ask-audit-unavailable"
          showCopyLink
        />
      ) : null}

      <InfraEvidenceRecentScopeStrip testId="infra-ask-recent-scope-strip" />

      {contextSummary != null ? (
        <section
          className="rounded border border-border bg-card p-4"
          data-testid="infra-ask-context-banner"
          aria-label="Ask grounding context"
        >
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
            Scope stack: {contextSummary}.
          </p>
          {cloudResourceId.length > 0 ? (
            <Link
              className="mt-2 inline-block text-sm text-al-link hover:underline"
              href={resourceHubFilterHrefFromSearch(cloudResourceId, "", {
                tab: hubBackLinkTab,
                snapshotId: snapshotId.length > 0 ? snapshotId : undefined,
                runId: runId.length > 0 ? runId : undefined,
                workQueue: workQueue !== "all" ? workQueue : undefined,
                assessmentId: assessmentId.length > 0 ? assessmentId : undefined,
                auditEvidenceSnapshotId: auditEvidenceSnapshotId.length > 0 ? auditEvidenceSnapshotId : undefined,
                controlId: controlId.length > 0 ? controlId : undefined,
              })}
              data-testid={
                askScopeHubTabLabel != null
                  || (
                    assessmentId.length > 0
                    && auditEvidenceSnapshotId.length > 0
                    && controlId.length > 0
                  )
                  ? "infra-ask-open-scope-hub-tab"
                  : workQueueScopedHubTabLabel != null
                    ? "infra-ask-open-work-queue-hub-tab"
                    : undefined
              }
            >
              {resourceHubBackLinkLabel}
            </Link>
          ) : null}
          {cloudResourceId.length > 0 && hubBackLinkTab != null ? (
            <Link
              className="mt-2 ml-4 inline-block text-sm text-al-link hover:underline"
              href={buildResourceHubOverviewHref(cloudResourceId, {
                snapshotId: snapshotId.length > 0 ? snapshotId : null,
                runId: runId.length > 0 ? runId : null,
                workQueue,
                assessmentId: assessmentId.length > 0 ? assessmentId : null,
                auditEvidenceSnapshotId: auditEvidenceSnapshotId.length > 0 ? auditEvidenceSnapshotId : null,
                controlId: controlId.length > 0 ? controlId : null,
              })}
              data-testid="infra-ask-open-overview-hub"
            >
              View overview in hub
            </Link>
          ) : null}
          {auditHubTabBackLinkHref != null ? (
            <Link
              className="mt-2 ml-4 inline-block text-sm text-al-link hover:underline"
              href={auditHubTabBackLinkHref}
              data-testid="infra-ask-open-audit-hub-tab"
            >
              View audit lineage in hub
            </Link>
          ) : null}
          {workQueue !== "all" ? (
            <Link
              className="mt-2 inline-block text-sm text-al-link hover:underline"
              href={resourceExplorerFilterHrefFromSearch("", { workQueue })}
              data-testid="infra-ask-explorer-back-link"
            >
              Back to resource explorer
            </Link>
          ) : null}
          {driftWorkbenchBackLinkHref != null ? (
            <Link
              className="mt-2 inline-block text-sm text-al-link hover:underline"
              href={driftWorkbenchBackLinkHref}
              data-testid="infra-ask-drift-back-link"
            >
              Open drift workbench
            </Link>
          ) : null}
          {terraformWorkbenchBackLinkHref != null ? (
            <Link
              className="mt-2 inline-block text-sm text-al-link hover:underline"
              href={terraformWorkbenchBackLinkHref}
              data-testid="infra-ask-terraform-back-link"
            >
              Open terraform workbench
            </Link>
          ) : null}
          {inventoryDiagramsBackLinkHref != null ? (
            <Link
              className="mt-2 inline-block text-sm text-al-link hover:underline"
              href={inventoryDiagramsBackLinkHref}
              data-testid="infra-ask-inventory-diagrams-back-link"
            >
              Open inventory diagrams
            </Link>
          ) : null}
          {diagramReconcileBackLinkHref != null ? (
            <Link
              className="mt-2 inline-block text-sm text-al-link hover:underline"
              href={diagramReconcileBackLinkHref}
              data-testid="infra-ask-diagram-reconcile-back-link"
            >
              Open diagram reconciliation workbench
            </Link>
          ) : null}
          {remediationFactoryBackLinkHref != null ? (
            <Link
              className="mt-2 inline-block text-sm text-al-link hover:underline"
              href={remediationFactoryBackLinkHref}
              data-testid="infra-ask-remediation-back-link"
            >
              Open remediation factory
            </Link>
          ) : null}
          {auditLineageBackLinkHref != null ? (
            <Link
              className="mt-2 inline-block text-sm text-al-link hover:underline"
              href={auditLineageBackLinkHref}
              data-testid="infra-ask-audit-lineage-back-link"
            >
              Open audit evidence control
            </Link>
          ) : null}
        </section>
      ) : (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          Open a resource hub and choose Ask, or pass `cloudResourceId` in the URL to scope questions to one resource.
        </p>
      )}

      <section className="grid gap-3 rounded border border-border bg-card p-4" aria-label="Infrastructure Ask prompt">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Question</span>
          <textarea
            className="min-h-28 rounded border border-input bg-background px-3 py-2"
            data-testid="infra-ask-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask a grounded question about inventory evidence…"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {INFRA_EVIDENCE_ASK_CANNED_QUESTIONS.map((cannedQuestion) => (
            <Button
              key={cannedQuestion}
              type="button"
              variant="outline"
              size="sm"
              data-testid={`infra-ask-canned-${cannedQuestion}`}
              onClick={() => {
                setQuestion(cannedQuestion);
                void ask(cannedQuestion);
              }}
            >
              {cannedQuestion}
            </Button>
          ))}
        </div>

        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            data-testid="infra-ask-use-simulator"
            checked={useSimulator}
            onChange={(event) => setUseSimulator(event.target.checked)}
          />
          <span>Use simulator (deterministic, citation-grounded template)</span>
        </label>

        <Button
          type="button"
          data-testid="infra-ask-submit"
          disabled={submitting || question.trim().length === 0}
          onClick={() => void ask(question)}
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Asking…
            </span>
          ) : (
            "Ask"
          )}
        </Button>
      </section>

      {submitError != null ? (
        <p className="m-0 text-sm text-destructive" role="alert">{submitError}</p>
      ) : null}

      {history.map((turn, index) => (
        <section
          key={`${turn.question}-${index}`}
          className="grid gap-3 rounded border border-border bg-card p-4"
          aria-label="Infrastructure Ask response"
          data-testid={index === history.length - 1 ? "infra-ask-response" : undefined}
        >
          <p className={cn("m-0 text-sm font-medium text-muted-foreground", OPERATOR_TYPOGRAPHY.helper)}>
            Question: {turn.question}
          </p>

          {turn.response.simulatorLabel != null ? (
            <p className="m-0 rounded bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100" data-testid="infra-ask-simulator-banner">
              {turn.response.simulatorLabel}
            </p>
          ) : null}

          {turn.response.insufficientEvidence ? (
            <div className="grid gap-2" data-testid="infra-ask-insufficient-evidence">
              <StatusTag kind="needs-attention" label="Insufficient evidence" />
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{turn.response.answer}</p>
            </div>
          ) : (
            <div className="grid gap-2">
              <StatusTag kind="ready" label={turn.response.topicKind} />
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{turn.response.answer}</p>
            </div>
          )}

          {turn.response.citations.length > 0 ? (
            <div className="grid gap-2">
              <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Citations</h2>
              <ul className="m-0 grid gap-2 pl-5">
                {turn.response.citations.map((citation) => {
                  const link = resolveInfraEvidenceAskCitationLink(citation, citationContext);
                  const key = `${citation.kind}:${citation.id}`;

                  return (
                    <li key={key} data-testid={`infra-ask-citation-${citation.kind}-${citation.id}`}>
                      {link != null ? (
                        <Link className="text-al-link hover:underline" href={link.href}>{link.label}</Link>
                      ) : (
                        <span>{citation.label ?? `${citation.kind}: ${citation.id}`}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}
