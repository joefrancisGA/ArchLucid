"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { WorkbenchAuditLineageStatus } from "@/components/infra-evidence/WorkbenchAuditLineageStatus";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { ShortcutHint } from "@/components/ShortcutHint";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import { Textarea } from "@/components/ui/textarea";
import { PageContextualHelpButton, PAGE_HELP_SHORT_TRIGGER_TEXT } from "@/components/usability/PageContextualHelpButton";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { useProductionDeskChrome, useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { CTA_WIDTH, DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { fetchInfraEvidenceSnapshots } from "@/lib/infra-evidence/infra-evidence-drift-api";
import {
  formatInfraEvidenceAskScopeStack,
  resolveInfraEvidenceAskSnapshotFreshness,
} from "@/lib/infra-evidence/infra-evidence-ask-scope-summary";
import {
  formatInfraEvidenceAskApiError,
  submitInfraEvidenceAsk,
} from "@/lib/infra-evidence/infra-evidence-ask-api";
import { infraEvidenceAskBlockedReason } from "@/lib/infra-evidence/infra-evidence-ask-blocked-reason";
import {
  buildInfraEvidenceAskScopeKey,
  mergeCannedQuestionIntoDraft,
  parkInfraEvidenceAskTranscript,
  readInfraEvidenceAskTranscript,
  writeInfraEvidenceAskTranscript,
  type InfraEvidenceAskTurn,
} from "@/lib/infra-evidence/infra-evidence-ask-transcript";
import { formatInfraEvidenceAskTopicKindLabel } from "@/lib/infra-evidence/infra-evidence-ask-topic-kind-label";

import { toApiLoadFailure } from "@/lib/api-load-failure";
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
  formatResourceHubTabViewLabelFromExplorerWorkQueue,
  parseResourceExplorerWorkQueueFromSearch,
  resolveResourceHubTabFromExplorerWorkQueue,
} from "@/lib/infra-evidence/infra-evidence-explorer-work-queue";
import { buildTerraformWorkbenchHref } from "@/lib/infra-evidence/infra-evidence-terraform-filter-url";
import { buildInfraEvidenceAuditControlOptions } from "@/lib/infra-evidence/infra-evidence-audit-control-options";
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
} from "@/lib/infra-evidence/infra-evidence-ask-types";
import {
  applyDiagramViewPlanToSearch,
  isDiagramViewPlanValid,
} from "@/lib/infra-evidence/apply-diagram-view-plan-to-search";
import {
  GOVERNANCE_INFRASTRUCTURE_ASK_CANNED_PROMPTS_LABEL,
  GOVERNANCE_INFRASTRUCTURE_ASK_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_ASK_CONTEXT_LABEL,
  GOVERNANCE_INFRASTRUCTURE_ASK_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_ASK_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_ASK_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_ASK_QUESTION_LABEL,
  GOVERNANCE_INFRASTRUCTURE_ASK_SCOPE_BACK_LINKS_LABEL,
  GOVERNANCE_INFRASTRUCTURE_ASK_SIMULATOR_STATUS_LABEL,
  GOVERNANCE_INFRASTRUCTURE_ASK_SKIP_LINK_LABEL,
  GOVERNANCE_INFRASTRUCTURE_ASK_SUBMIT_BLOCKED_LABEL,
  GOVERNANCE_INFRASTRUCTURE_ASK_SUBMIT_FAILED_LABEL,
  GOVERNANCE_INFRASTRUCTURE_ASK_SUBMIT_READINESS_BUSY,
  GOVERNANCE_INFRASTRUCTURE_ASK_SUBMIT_READINESS_EMPTY,
  GOVERNANCE_INFRASTRUCTURE_ASK_SUBMIT_SHORTCUT_LABEL,
  GOVERNANCE_INFRASTRUCTURE_ASK_TRANSCRIPT_INDEX_LABEL,
  GOVERNANCE_INFRASTRUCTURE_ASK_UNSCOPED_ACTION,
  GOVERNANCE_INFRASTRUCTURE_ASK_UNSCOPED_BODY,
  GOVERNANCE_INFRASTRUCTURE_ASK_OPERATOR_EYEBROW,
  GOVERNANCE_INFRASTRUCTURE_ASK_UNSCOPED_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OPEN_ACTION,
} from "@/lib/governance/governance-infrastructure-copy";
import { GOVERNANCE_INFRASTRUCTURE_ASK_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { infrastructureResourcesPathForProductLine } from "@/lib/product-line/securenow-infrastructure-resources-route";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { cn } from "@/lib/utils";

import { InfrastructureAskBreadcrumb } from "./InfrastructureAskBreadcrumb";
import { InfrastructureAskClaimOrientationStrip } from "./InfrastructureAskClaimOrientationStrip";

type ScopeBackLink = {
  readonly href: string;
  readonly label: string;
  readonly testId?: string;
};

const cnCard =
  "rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950";

function buildInfraAskTurnId(index: number): string {
  return `infra-ask-turn-${index + 1}`;
}

export function InfrastructureAskClient() {
  const buyerPolishedShell = useProductionEvalChrome();
  const workingDeskChrome = useProductionDeskChrome();
  const { productLine } = useProductLine();
  const resourcesPath = useMemo(
    () => infrastructureResourcesPathForProductLine(productLine),
    [productLine],
  );
  const router = useRouter();
  const searchParams = useSearchParams();
  const questionTextareaRef = useRef<HTMLTextAreaElement>(null);
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

  const scopeKey = useMemo(
    () =>
      buildInfraEvidenceAskScopeKey({
        cloudResourceId,
        snapshotId,
        diffId,
        findingId,
        instanceId,
        correspondenceId,
        runId,
        seedNodeId,
        assessmentId,
        auditEvidenceSnapshotId,
        controlId,
        workQueue,
        hubTab: hubTabOrigin,
      }),
    [
      assessmentId,
      auditEvidenceSnapshotId,
      cloudResourceId,
      controlId,
      correspondenceId,
      diffId,
      findingId,
      hubTabOrigin,
      instanceId,
      runId,
      seedNodeId,
      snapshotId,
      workQueue,
    ],
  );

  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitErrorIsBlocked, setSubmitErrorIsBlocked] = useState(false);
  const [history, setHistory] = useState<InfraEvidenceAskTurn[]>([]);
  const [snapshotCapturedUtc, setSnapshotCapturedUtc] = useState<string | null>(null);
  const previousScopeKeyRef = useRef<string | null>(null);
  const historyRef = useRef(history);
  const questionRef = useRef(question);
  const scopeKeyRef = useRef(scopeKey);

  historyRef.current = history;
  questionRef.current = question;
  scopeKeyRef.current = scopeKey;

  useEffect(() => {
    if (snapshotId.length === 0) {
      setSnapshotCapturedUtc(null);

      return;
    }

    let cancelled = false;

    void fetchInfraEvidenceSnapshots(1, 50).then((response) => {
      if (cancelled) {
        return;
      }

      const match = response.items.find((item) => item.snapshotId === snapshotId);

      setSnapshotCapturedUtc(match?.capturedUtc ?? null);
    });

    return () => {
      cancelled = true;
    };
  }, [snapshotId]);

  useEffect(() => {
    const previousScopeKey = previousScopeKeyRef.current;

    if (previousScopeKey !== null && previousScopeKey !== scopeKey) {
      parkInfraEvidenceAskTranscript(previousScopeKey, {
        turns: historyRef.current,
        draft: questionRef.current,
      });
    }

    const stored = readInfraEvidenceAskTranscript(scopeKey);

    setHistory([...stored.turns]);
    setQuestion(stored.draft);
    setSubmitError(null);
    setSubmitErrorIsBlocked(false);
    previousScopeKeyRef.current = scopeKey;
  }, [scopeKey]);

  useEffect(() => {
    writeInfraEvidenceAskTranscript(scopeKey, {
      turns: history,
      draft: question,
    });
  }, [history, question, scopeKey]);

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

  const snapshotFreshness = useMemo(
    () =>
      snapshotId.length > 0
        ? resolveInfraEvidenceAskSnapshotFreshness(snapshotId, snapshotCapturedUtc)
        : null,
    [snapshotCapturedUtc, snapshotId],
  );

  const contextSummary = useMemo(
    () =>
      formatInfraEvidenceAskScopeStack({
        cloudResourceId,
        snapshotId,
        snapshotCapturedUtc,
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
      snapshotCapturedUtc,
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

  const scopeBackLinks = useMemo(() => {
    const links: ScopeBackLink[] = [];

    if (cloudResourceId.length > 0) {
      links.push({
        href: resourceHubFilterHrefFromSearch(cloudResourceId, "", {
          tab: hubBackLinkTab,
          snapshotId: snapshotId.length > 0 ? snapshotId : undefined,
          runId: runId.length > 0 ? runId : undefined,
          workQueue: workQueue !== "all" ? workQueue : undefined,
          assessmentId: assessmentId.length > 0 ? assessmentId : undefined,
          auditEvidenceSnapshotId: auditEvidenceSnapshotId.length > 0 ? auditEvidenceSnapshotId : undefined,
          controlId: controlId.length > 0 ? controlId : undefined,
        }),
        label: resourceHubBackLinkLabel,
        testId:
          askScopeHubTabLabel != null
          || (
            assessmentId.length > 0
            && auditEvidenceSnapshotId.length > 0
            && controlId.length > 0
          )
            ? "infra-ask-open-scope-hub-tab"
            : workQueueScopedHubTabLabel != null
              ? "infra-ask-open-work-queue-hub-tab"
              : undefined,
      });
    }

    if (cloudResourceId.length > 0 && hubBackLinkTab != null) {
      links.push({
        href: buildResourceHubOverviewHref(cloudResourceId, {
          snapshotId: snapshotId.length > 0 ? snapshotId : null,
          runId: runId.length > 0 ? runId : null,
          workQueue,
          assessmentId: assessmentId.length > 0 ? assessmentId : null,
          auditEvidenceSnapshotId: auditEvidenceSnapshotId.length > 0 ? auditEvidenceSnapshotId : null,
          controlId: controlId.length > 0 ? controlId : null,
        }),
        label: "View overview in hub",
        testId: "infra-ask-open-overview-hub",
      });
    }

    if (auditHubTabBackLinkHref != null) {
      links.push({
        href: auditHubTabBackLinkHref,
        label: "View audit lineage in hub",
        testId: "infra-ask-open-audit-hub-tab",
      });
    }

    if (workQueue !== "all") {
      links.push({
        href: resourceExplorerFilterHrefFromSearch("", { workQueue }),
        label: "Back to resource explorer",
        testId: "infra-ask-explorer-back-link",
      });
    }

    if (driftWorkbenchBackLinkHref != null) {
      links.push({
        href: driftWorkbenchBackLinkHref,
        label: "Open drift workbench",
        testId: "infra-ask-drift-back-link",
      });
    }

    if (terraformWorkbenchBackLinkHref != null) {
      links.push({
        href: terraformWorkbenchBackLinkHref,
        label: "Open terraform workbench",
        testId: "infra-ask-terraform-back-link",
      });
    }

    if (inventoryDiagramsBackLinkHref != null) {
      links.push({
        href: inventoryDiagramsBackLinkHref,
        label: GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OPEN_ACTION,
        testId: "infra-ask-inventory-diagrams-back-link",
      });
    }

    if (diagramReconcileBackLinkHref != null) {
      links.push({
        href: diagramReconcileBackLinkHref,
        label: "Open diagram reconciliation workbench",
        testId: "infra-ask-diagram-reconcile-back-link",
      });
    }

    if (remediationFactoryBackLinkHref != null) {
      links.push({
        href: remediationFactoryBackLinkHref,
        label: "Open remediation factory",
        testId: "infra-ask-remediation-back-link",
      });
    }

    if (auditLineageBackLinkHref != null) {
      links.push({
        href: auditLineageBackLinkHref,
        label: "Open audit evidence control",
        testId: "infra-ask-audit-lineage-back-link",
      });
    }

    return links;
  }, [
    askScopeHubTabLabel,
    assessmentId,
    auditEvidenceSnapshotId,
    auditHubTabBackLinkHref,
    auditLineageBackLinkHref,
    cloudResourceId,
    controlId,
    diagramReconcileBackLinkHref,
    driftWorkbenchBackLinkHref,
    hubBackLinkTab,
    inventoryDiagramsBackLinkHref,
    remediationFactoryBackLinkHref,
    resourceHubBackLinkLabel,
    runId,
    snapshotId,
    terraformWorkbenchBackLinkHref,
    workQueue,
    workQueueScopedHubTabLabel,
  ]);

  const askDisabled = submitting || question.trim().length === 0;
  const submitReadinessLine = submitting
    ? GOVERNANCE_INFRASTRUCTURE_ASK_SUBMIT_READINESS_BUSY
    : question.trim().length === 0
      ? GOVERNANCE_INFRASTRUCTURE_ASK_SUBMIT_READINESS_EMPTY
      : null;

  const ask = useCallback(async (nextQuestion: string) => {
    const trimmed = nextQuestion.trim();

    if (trimmed.length === 0) {
      return;
    }

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitErrorIsBlocked(false);

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
      });
      setHistory((current) => [...current, { question: trimmed, response: result }]);
      setQuestion("");
    } catch (error: unknown) {
      const failure = toApiLoadFailure(error);
      const blockedReason = infraEvidenceAskBlockedReason(failure);

      setSubmitError(blockedReason ?? formatInfraEvidenceAskApiError(error));
      setSubmitErrorIsBlocked(blockedReason != null);
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
    submitting,
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


  const handleCannedQuestionClick = useCallback((cannedQuestion: string) => {
    setQuestion((current) => mergeCannedQuestionIntoDraft(current, cannedQuestion));
    questionTextareaRef.current?.focus();
  }, []);

  const handleQuestionKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();

        if (askDisabled) {
          return;
        }

        void ask(question);
      }
    },
    [ask, askDisabled, question],
  );

  const latestSimulatorLabel = history.length > 0
    ? history[history.length - 1]?.response.simulatorLabel
    : null;

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      {latestSimulatorLabel != null ? (
        <StatusTag
          kind="needs-attention"
          label={GOVERNANCE_INFRASTRUCTURE_ASK_SIMULATOR_STATUS_LABEL}
          data-testid="infra-ask-simulator-status-header"
        />
      ) : null}
      <PageContextualHelpButton triggerText={buyerPolishedShell ? PAGE_HELP_SHORT_TRIGGER_TEXT : undefined} />

    </div>
  );

  const transcriptRegion = history.length > 0 ? (
    <div
      className="grid gap-4 lg:grid-cols-[minmax(10rem,12rem)_minmax(0,1fr)]"
      data-testid="infra-ask-transcript-layout"
    >
      <nav
        aria-label={GOVERNANCE_INFRASTRUCTURE_ASK_TRANSCRIPT_INDEX_LABEL}
        className={cn("hidden lg:block", cnCard)}
        data-testid="infra-ask-transcript-index"
      >
        <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>{GOVERNANCE_INFRASTRUCTURE_ASK_TRANSCRIPT_INDEX_LABEL}</h2>
        <ol className="m-0 mt-2 grid list-none gap-1 p-0">
          {history.map((turn, index) => (
            <li key={`${turn.question}-${index}`}>
              <a
                href={`#${buildInfraAskTurnId(index)}`}
                className={cn("block text-sm text-al-link hover:underline", OPERATOR_LINK)}
              >
                Turn {index + 1}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="grid gap-4">
        {history.map((turn, index) => (
          <section
            key={`${turn.question}-${index}`}
            id={buildInfraAskTurnId(index)}
            className={cn("grid gap-3 scroll-mt-24", cnCard)}
            aria-label="Infrastructure Ask response"
            data-testid={index === history.length - 1 ? "infra-ask-response" : undefined}
          >
            <p className={cn("m-0 text-sm font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Question: {turn.question}
            </p>

            {turn.response.simulatorLabel != null ? (
              <p
                className={cn(
                  "m-0 rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-al-text-secondary dark:border-neutral-700 dark:bg-neutral-900/40",
                  OPERATOR_TYPOGRAPHY.helper,
                )}
                data-testid="infra-ask-simulator-banner"
              >
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
                <p className={cn("m-0 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Topic: {formatInfraEvidenceAskTopicKindLabel(turn.response.topicKind)}
                </p>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{turn.response.answer}</p>

              {turn.response.viewPlan != null ? (
                <div className="grid gap-2" data-testid="infra-ask-apply-view">
                  <Button
                    type="button"
                    variant="primary"
                    className={CTA_WIDTH.content}
                    disabled={!isDiagramViewPlanValid(turn.response.viewPlan)}
                    onClick={() => {
                      const result = applyDiagramViewPlanToSearch(
                        searchParams.toString(),
                        turn.response.viewPlan!,
                      );

                      if (result.error == null) {
                        router.push(result.href);
                      }
                    }}
                  >
                    Apply this view
                  </Button>
                  {!isDiagramViewPlanValid(turn.response.viewPlan) ? (
                    <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="alert">
                      This view plan cannot be applied until required fields are present.
                    </p>
                  ) : null}
                </div>
              ) : null}
              </div>
            )}

            {turn.response.citations.length > 0 ? (
              <div className="grid gap-2">
                <h3 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Citations</h3>
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
    </div>
  ) : null;

  return (
    <OperatorPageContainer
      variant="full"
      className="py-4"
      data-testid="infra-ask-page"
    >
      <a
        href={`#${GOVERNANCE_INFRASTRUCTURE_ASK_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {GOVERNANCE_INFRASTRUCTURE_ASK_SKIP_LINK_LABEL}
      </a>

      <OperatorPageHeader
        navHref={GOVERNANCE_INFRASTRUCTURE_ASK_PATH}
        eyebrow={buyerPolishedShell ? undefined : GOVERNANCE_INFRASTRUCTURE_ASK_OPERATOR_EYEBROW}
        title={GOVERNANCE_INFRASTRUCTURE_ASK_PAGE_TITLE}
        subtitle={GOVERNANCE_INFRASTRUCTURE_ASK_PAGE_LEAD}
        claimDiscipline={
          buyerPolishedShell || workingDeskChrome ? GOVERNANCE_INFRASTRUCTURE_ASK_CLAIM_DISCIPLINE : undefined
        }
        claimDisciplineTestId="infra-ask-claim-discipline"
        titleTestId="infra-ask-page-title"
        breadcrumb={<InfrastructureAskBreadcrumb />}
        actions={headerActions}
      />


      <main
        id={GOVERNANCE_INFRASTRUCTURE_ASK_PRIMARY_CONTENT_ID}
        className={cn("flex w-full flex-col gap-4", buyerPolishedShell || workingDeskChrome ? "scroll-mt-24" : undefined)}
        data-testid="infra-ask-primary-content"
      >

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
        />
      ) : null}


      {contextSummary != null ? (
        <section
          className={cnCard}
          data-testid="infra-ask-context-banner"
          aria-label="Ask grounding context"
        >
          <div className="grid gap-2">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              {buyerPolishedShell ? GOVERNANCE_INFRASTRUCTURE_ASK_CONTEXT_LABEL : "Scope stack"}: {contextSummary}.
            </p>
            {snapshotFreshness != null ? (
              <div
                className="flex flex-wrap items-center gap-2"
                data-testid="infra-ask-snapshot-freshness"
              >
                <span className={cn("text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Snapshot {snapshotFreshness.snapshotId} · captured {snapshotFreshness.capturedLabel} · {snapshotFreshness.ageLabel}
                </span>
                <StatusTag
                  kind={snapshotFreshness.statusKind}
                  label={snapshotFreshness.statusLabel}
                />
              </div>
            ) : null}
          </div>
          {scopeBackLinks.length > 0 ? (
            <nav aria-label={GOVERNANCE_INFRASTRUCTURE_ASK_SCOPE_BACK_LINKS_LABEL} className="mt-3">
              <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                {GOVERNANCE_INFRASTRUCTURE_ASK_SCOPE_BACK_LINKS_LABEL}
              </h2>
              <ul className="m-0 mt-2 grid list-none gap-1 p-0">
                {scopeBackLinks.map((link) => (
                  <li key={`${link.testId ?? link.label}-${link.href}`}>
                    <Link
                      className={cn("text-sm text-al-link hover:underline", OPERATOR_LINK)}
                      href={link.href}
                      data-testid={link.testId}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </section>
      ) : buyerPolishedShell ? (
        <EnterpriseCompactEmptyState
          title={GOVERNANCE_INFRASTRUCTURE_ASK_UNSCOPED_TITLE}
          description={GOVERNANCE_INFRASTRUCTURE_ASK_UNSCOPED_BODY}
          testId="infra-ask-unscoped-panel"
          actions={[
            {
              label: GOVERNANCE_INFRASTRUCTURE_ASK_UNSCOPED_ACTION,
              href: resourcesPath,
              variant: "primary",
            },
          ]}
        />
      ) : (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="infra-ask-unscoped-hint">
          Open a resource hub and choose Ask, or pass{" "}
          <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-sm dark:bg-neutral-900">cloudResourceId</code>{" "}
          in the URL to scope questions to one resource. Browse the{" "}
          <Link className={cn("text-al-link hover:underline", OPERATOR_LINK)} href={resourcesPath}>
            resource explorer
          </Link>{" "}
          ({resourcesPath}) to pick a resource.
        </p>
      )}

      <section className={cn("grid gap-3", cnCard)} aria-label="Infrastructure Ask prompt">
        <div className="grid gap-2">
          <Label htmlFor="infra-ask-question">{GOVERNANCE_INFRASTRUCTURE_ASK_QUESTION_LABEL}</Label>
          <Textarea
            ref={questionTextareaRef}
            id="infra-ask-question"
            className="min-h-28"
            data-testid="infra-ask-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={handleQuestionKeyDown}
            placeholder="Ask a grounded question about inventory evidence…"
          />
        </div>

        <div
          role="group"
          aria-label={GOVERNANCE_INFRASTRUCTURE_ASK_CANNED_PROMPTS_LABEL}
          className="flex flex-wrap gap-2"
          data-testid="infra-ask-canned-prompts"
        >
          {INFRA_EVIDENCE_ASK_CANNED_QUESTIONS.map((cannedQuestion) => (
            <Button
              key={cannedQuestion}
              type="button"
              variant="outline"
              size="sm"
              data-testid={`infra-ask-canned-${cannedQuestion}`}
              onClick={() => handleCannedQuestionClick(cannedQuestion)}
            >
              {cannedQuestion}
            </Button>
          ))}
        </div>

        <div className="grid justify-items-start gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="primary"
              className={CTA_WIDTH.content}
              data-testid="infra-ask-submit"
              disabled={askDisabled}
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
            <ShortcutHint shortcut={GOVERNANCE_INFRASTRUCTURE_ASK_SUBMIT_SHORTCUT_LABEL} />
          </div>
          {submitReadinessLine != null ? (
            <p
              id="infra-ask-submit-readiness"
              className={cn("m-0 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            >
              {submitReadinessLine}
            </p>
          ) : null}
        </div>
      </section>

      {submitError != null ? (
        <div
          className={cn("rounded-md border px-3 py-2", DESIGN_TOKENS.callout.warn)}
          role="alert"
          data-testid="infra-ask-submit-error"
        >
          <div className="flex flex-wrap items-center gap-2">
            <StatusTag
              kind={submitErrorIsBlocked ? "blocked" : "needs-attention"}
              label={
                submitErrorIsBlocked
                  ? GOVERNANCE_INFRASTRUCTURE_ASK_SUBMIT_BLOCKED_LABEL
                  : GOVERNANCE_INFRASTRUCTURE_ASK_SUBMIT_FAILED_LABEL
              }
            />
          </div>
          <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{submitError}</p>
        </div>
      ) : null}

      {transcriptRegion}

        {buyerPolishedShell ? <InfrastructureAskClaimOrientationStrip /> : null}
      </main>
    </OperatorPageContainer>
  );
}
