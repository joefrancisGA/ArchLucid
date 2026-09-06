"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { LayerHeader } from "@/components/LayerHeader";
import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import {
  EnterpriseTabs,
  EnterpriseTabsContent,
  EnterpriseTabsList,
  EnterpriseTabsTrigger,
} from "@/components/ui/enterprise-tabs";
import { StatusTag } from "@/components/ui/status-tag";
import {
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import {
  buildAuditEvidenceLineageUiPath,
  buildResourceHubDiagramReconcileWorkbenchHref,
  buildResourceHubDiagramsWorkbenchHref,
  buildResourceHubDriftWorkbenchHref,
} from "@/lib/infra-evidence/infra-evidence-ask-citations";
import {
  buildDriftWorkbenchHref,
  buildRemediationWorkbenchHref,
  buildResourceHubWorkbenchHref,
  buildResourceScopedWorkbenchHref,
} from "@/lib/infra-evidence/infra-evidence-workbench-url";
import { buildDiagramReconcileRemediationHref } from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-filter-url";
import {
  fetchCloudResourceEvidenceHub,
  formatInfraEvidenceHubApiError,
} from "@/lib/infra-evidence/infra-evidence-hub-api";
import {
  createRemediationInstance,
  formatInfraEvidenceRemediationApiError,
  matchOperationalFinding,
} from "@/lib/infra-evidence/infra-evidence-remediation-api";
import {
  buildInfrastructureAskHref,
  parseResourceHubQueryValueFromSearch,
  parseResourceHubTabFromSearch,
  resourceHubFilterHrefFromSearch,
  RESOURCE_HUB_ASSESSMENT_ID_PARAM,
  RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM,
  RESOURCE_HUB_CONTROL_ID_PARAM,
  RESOURCE_HUB_RUN_ID_PARAM,
  RESOURCE_HUB_SNAPSHOT_ID_PARAM,
  RESOURCE_HUB_TAB_PARAM,
} from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import type {
  CloudResourceAuditLineageMatch,
  CloudResourceEvidenceHubResponse,
  CloudResourceInventoryChangeSummary,
  ResourceHubTab,
} from "@/lib/infra-evidence/infra-evidence-hub-types";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { TERRAFORM_ADVISORY_EXPORT_DISCLAIMER } from "@/lib/terraform-advisory-disclaimer";
import { cn } from "@/lib/utils";

const HUB_TABS: readonly { readonly id: ResourceHubTab; readonly label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "drift", label: "Drift" },
  { id: "diagram", label: "Diagram" },
  { id: "terraform", label: "Terraform" },
  { id: "findings", label: "Findings" },
  { id: "remediation", label: "Remediation" },
  { id: "audit", label: "Audit lineage" },
];

type ResourceHubClientProps = {
  readonly cloudResourceId: string;
};

function buildHubDriftChangeWorkbenchHref(
  cloudResourceId: string,
  snapshotId: string,
  change: CloudResourceInventoryChangeSummary,
): string {
  return buildDriftWorkbenchHref({
    cloudResourceId,
    snapshotId,
    changeId: change.changeId,
    diffId: change.diffId,
  });
}

function buildHubDriftChangeAskHref(
  cloudResourceId: string,
  snapshotId: string,
  change: CloudResourceInventoryChangeSummary,
): string {
  return buildInfrastructureAskHref({
    cloudResourceId,
    snapshotId,
    diffId: change.diffId,
  });
}

function buildHubFindingAskHref(
  cloudResourceId: string,
  snapshotId: string,
  findingId: string,
): string {
  return buildInfrastructureAskHref({
    cloudResourceId,
    snapshotId: snapshotId.length > 0 ? snapshotId : undefined,
    findingId,
  });
}

function buildHubRemediationAskHref(
  cloudResourceId: string,
  snapshotId: string,
  instanceId: string,
): string {
  return buildInfrastructureAskHref({
    cloudResourceId,
    snapshotId: snapshotId.length > 0 ? snapshotId : undefined,
    instanceId,
  });
}

function buildHubAuditLineageAskHref(
  cloudResourceId: string,
  snapshotId: string,
  context: {
    readonly assessmentId: string;
    readonly auditEvidenceSnapshotId: string;
    readonly controlId: string;
  },
): string {
  return buildInfrastructureAskHref({
    cloudResourceId,
    snapshotId: snapshotId.length > 0 ? snapshotId : undefined,
    assessmentId: context.assessmentId,
    auditEvidenceSnapshotId: context.auditEvidenceSnapshotId,
    controlId: context.controlId,
  });
}

function buildHubAuditLineageTabHref(
  cloudResourceId: string,
  snapshotId: string,
  context: {
    readonly assessmentId: string;
    readonly auditEvidenceSnapshotId: string;
    readonly controlId: string;
  },
): string {
  return resourceHubFilterHrefFromSearch(cloudResourceId, "", {
    tab: "audit",
    snapshotId: snapshotId.length > 0 ? snapshotId : undefined,
    assessmentId: context.assessmentId,
    auditEvidenceSnapshotId: context.auditEvidenceSnapshotId,
    controlId: context.controlId,
  });
}

function buildHubDiagramTabHref(
  cloudResourceId: string,
  snapshotId: string,
  runId: string,
): string {
  return resourceHubFilterHrefFromSearch(cloudResourceId, "", {
    tab: "diagram",
    snapshotId: snapshotId.length > 0 ? snapshotId : undefined,
    runId: runId.length > 0 ? runId : undefined,
  });
}

function buildHubOverviewTabHref(
  cloudResourceId: string,
  snapshotId: string,
  runId: string,
): string {
  return resourceHubFilterHrefFromSearch(cloudResourceId, "", {
    tab: "overview",
    snapshotId: snapshotId.length > 0 ? snapshotId : undefined,
    runId: runId.length > 0 ? runId : undefined,
  });
}

type HubOverviewTabLinkProps = {
  readonly cloudResourceId: string;
  readonly resolvedSnapshotId: string;
  readonly runId: string;
  readonly testId: string;
};

function HubOverviewTabLink(props: HubOverviewTabLinkProps) {
  const { cloudResourceId, resolvedSnapshotId, runId, testId } = props;

  return (
    <Button asChild variant="outline" size="sm" data-testid={testId}>
      <Link href={buildHubOverviewTabHref(cloudResourceId, resolvedSnapshotId, runId)}>
        View overview in hub
      </Link>
    </Button>
  );
}

function buildHubDiagramCorrespondenceAskHref(
  cloudResourceId: string,
  snapshotId: string,
  runId: string,
  correspondenceId: string,
): string {
  return buildInfrastructureAskHref({
    cloudResourceId,
    snapshotId: snapshotId.length > 0 ? snapshotId : undefined,
    runId: runId.length > 0 ? runId : undefined,
    correspondenceId,
  });
}

export function ResourceHubClient(props: ResourceHubClientProps) {
  const { cloudResourceId } = props;
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseResourceHubTabFromSearch(searchParams.get(RESOURCE_HUB_TAB_PARAM));
  const runId = parseResourceHubQueryValueFromSearch(searchParams.get(RESOURCE_HUB_RUN_ID_PARAM));
  const snapshotId = parseResourceHubQueryValueFromSearch(searchParams.get(RESOURCE_HUB_SNAPSHOT_ID_PARAM));
  const assessmentId = parseResourceHubQueryValueFromSearch(searchParams.get(RESOURCE_HUB_ASSESSMENT_ID_PARAM));
  const auditEvidenceSnapshotId = parseResourceHubQueryValueFromSearch(
    searchParams.get(RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM),
  );
  const controlId = parseResourceHubQueryValueFromSearch(searchParams.get(RESOURCE_HUB_CONTROL_ID_PARAM));

  const [hub, setHub] = useState<CloudResourceEvidenceHubResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [findingActionBusyId, setFindingActionBusyId] = useState<string | null>(null);
  const [findingActionMessage, setFindingActionMessage] = useState<string | null>(null);

  const resolvedSnapshotId = useMemo(() => {
    if (snapshotId.length > 0) {
      return snapshotId;
    }

    return hub?.currentConfiguration?.snapshotId ?? "";
  }, [hub?.currentConfiguration?.snapshotId, snapshotId]);

  const loadHub = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const response = await fetchCloudResourceEvidenceHub(cloudResourceId, {
        runId,
        snapshotId,
        assessmentId,
        auditEvidenceSnapshotId,
        controlId,
      });
      setHub(response);
    } catch (error: unknown) {
      setHub(null);
      setLoadError(formatInfraEvidenceHubApiError(error));
    } finally {
      setLoading(false);
    }
  }, [assessmentId, auditEvidenceSnapshotId, cloudResourceId, controlId, runId, snapshotId]);

  useEffect(() => {
    void loadHub();
  }, [loadHub]);

  const setActiveTab = (tab: ResourceHubTab) => {
    const nextHref = resourceHubFilterHrefFromSearch(cloudResourceId, searchParams.toString(), { tab });
    router.replace(nextHref);
  };

  const resourceTitle = useMemo(() => {
    if (hub == null) {
      return cloudResourceId;
    }

    const configName = hub.currentConfiguration?.azureResourceId.split("/").pop();

    return configName ?? hub.externalResourceId.split("/").pop() ?? cloudResourceId;
  }, [cloudResourceId, hub]);

  const resolvedAuditLineage = useMemo(() => {
    if (hub?.auditLineageLink.available !== true) {
      return null;
    }

    const resolvedAssessmentId =
      assessmentId.length > 0 ? assessmentId : hub.auditLineageLink.assessmentId ?? "";
    const resolvedAuditSnapshotId =
      auditEvidenceSnapshotId.length > 0
        ? auditEvidenceSnapshotId
        : hub.auditLineageLink.auditEvidenceSnapshotId ?? "";
    const resolvedControlId = controlId.length > 0 ? controlId : hub.auditLineageLink.controlId ?? "";

    if (
      resolvedAssessmentId.length === 0
      || resolvedAuditSnapshotId.length === 0
      || resolvedControlId.length === 0
    ) {
      return null;
    }

    const labelParts = [
      hub.auditLineageLink.controlNumber,
      hub.auditLineageLink.controlTitle,
    ].filter((part) => part != null && part.trim().length > 0);

    return {
      assessmentId: resolvedAssessmentId,
      auditEvidenceSnapshotId: resolvedAuditSnapshotId,
      controlId: resolvedControlId,
      label: labelParts.length > 0 ? labelParts.join(" · ") : "Open audit control lineage",
      matches: hub.auditLineageLink.matches,
    };
  }, [assessmentId, auditEvidenceSnapshotId, controlId, hub]);

  const hubTabs = useMemo(() => {
    if (hub == null) {
      return HUB_TABS;
    }

    const openFindingsCount =
      hub.operationalSecurityFindings.totalCount + hub.architectureReviewFindings.totalCount;

    return HUB_TABS.map((tab) => {
      if (tab.id === "findings" && openFindingsCount > 0) {
        return { ...tab, label: `Findings (${openFindingsCount})` };
      }

      if (tab.id === "remediation" && hub.remediationInstances.totalCount > 0) {
        return { ...tab, label: `Remediation (${hub.remediationInstances.totalCount})` };
      }

      if (tab.id === "drift" && hub.recentChanges.length > 0) {
        return { ...tab, label: `Drift (${hub.recentChanges.length})` };
      }

      return tab;
    });
  }, [hub]);

  const openFindingsCount = useMemo(() => {
    if (hub == null) {
      return 0;
    }

    return hub.operationalSecurityFindings.totalCount + hub.architectureReviewFindings.totalCount;
  }, [hub]);

  const hasTerraformMapping = useMemo(() => {
    if (hub == null) {
      return false;
    }

    const terraformAddress = hub.terraformAddress?.trim() ?? "";

    return terraformAddress.length > 0;
  }, [hub]);

  const diagramCorrespondenceRemediationHref = useMemo(() => {
    if (hub?.diagramCorrespondence == null) {
      return null;
    }

    return buildDiagramReconcileRemediationHref({
      row: hub.diagramCorrespondence,
      runId,
      snapshotId: resolvedSnapshotId,
      scopedCloudResourceId: cloudResourceId,
    });
  }, [cloudResourceId, hub?.diagramCorrespondence, resolvedSnapshotId, runId]);

  const runMatchRemediationFromFinding = async (findingId: string) => {
    const trimmedFindingId = findingId.trim();

    if (trimmedFindingId.length === 0) {
      return;
    }

    setFindingActionBusyId(trimmedFindingId);
    setFindingActionMessage(null);

    try {
      await matchOperationalFinding(trimmedFindingId);
      const result = await createRemediationInstance(trimmedFindingId);

      if (!result.succeeded) {
        setFindingActionMessage(result.blockers.join(" ") || result.errorMessage || "Remediation create failed.");
        return;
      }

      if (result.instanceId != null) {
        setFindingActionMessage(`Remediation instance ${result.instanceId} created.`);
      }

      await loadHub();
    } catch (error: unknown) {
      setFindingActionMessage(formatInfraEvidenceRemediationApiError(error));
    } finally {
      setFindingActionBusyId(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <LayerHeader pageKey="infrastructure-resources" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>{resourceTitle}</h1>
          <p className={cn("m-0 font-mono text-xs text-muted-foreground", OPERATOR_TYPOGRAPHY.helper)}>
            {hub?.externalResourceId ?? cloudResourceId}
          </p>
        </div>
        <Link className="text-sm text-al-link hover:underline" href={GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH}>
          Back to explorer
        </Link>
      </div>

      {loadError != null ? (
        <p className="m-0 text-sm text-destructive" role="alert">{loadError}</p>
      ) : null}

      {loading ? (
        <p className={cn("m-0 inline-flex items-center gap-2", OPERATOR_TYPOGRAPHY.helper)}>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading evidence hub…
        </p>
      ) : null}

      {!loading && hub != null ? (
        <EnterpriseTabs value={activeTab} onValueChange={(value) => setActiveTab(value as ResourceHubTab)}>
          <EnterpriseTabsList aria-label="Resource evidence hub sections" data-testid="infra-resource-hub-tabs">
            {hubTabs.map((tab) => (
              <EnterpriseTabsTrigger key={tab.id} value={tab.id} data-testid={`infra-resource-hub-tab-${tab.id}`}>
                {tab.label}
              </EnterpriseTabsTrigger>
            ))}
          </EnterpriseTabsList>

          <EnterpriseTabsContent value="overview" className="mt-4 space-y-4">
            <section className="rounded border border-border bg-card p-4">
              <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Ask about this resource</h2>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                Open Infrastructure Ask with this resource and snapshot context prefilled.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3" data-testid="infra-resource-hub-open-ask">
                <Link
                  href={buildInfrastructureAskHref({
                    cloudResourceId,
                    snapshotId: resolvedSnapshotId,
                    runId,
                    assessmentId,
                    auditEvidenceSnapshotId,
                    controlId,
                  })}
                >
                  Ask about this resource
                </Link>
              </Button>
            </section>

            <section className="rounded border border-border bg-card p-4">
              <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Work quick links</h2>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                Jump to scoped workbenches for this resource without re-filtering manually.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-open-remediation-work">
                  <Link href={buildResourceScopedWorkbenchHref(cloudResourceId, "remediation", resolvedSnapshotId)}>
                    Open remediation factory
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-open-drift-work">
                  <Link href={buildResourceScopedWorkbenchHref(cloudResourceId, "drift", resolvedSnapshotId)}>
                    Open drift workbench
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-open-diagrams-work">
                  <Link
                    href={buildResourceHubDiagramsWorkbenchHref(
                      resolvedSnapshotId,
                      cloudResourceId,
                      hub.externalResourceId,
                    )}
                  >
                    Open inventory diagrams
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-open-diagram-reconcile-work">
                  <Link
                    href={buildResourceHubDiagramReconcileWorkbenchHref(
                      resolvedSnapshotId,
                      runId,
                      undefined,
                      cloudResourceId,
                    )}
                  >
                    Open diagram reconciliation
                  </Link>
                </Button>
                {openFindingsCount > 0 ? (
                  <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-open-findings-tab">
                    <Link
                      href={buildResourceHubWorkbenchHref({
                        cloudResourceId,
                        tab: "findings",
                        snapshotId: resolvedSnapshotId,
                      })}
                    >
                      View findings in hub
                    </Link>
                  </Button>
                ) : null}
                {hub.recentChanges.length > 0 ? (
                  <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-open-drift-tab">
                    <Link
                      href={buildResourceHubWorkbenchHref({
                        cloudResourceId,
                        tab: "drift",
                        snapshotId: resolvedSnapshotId,
                      })}
                    >
                      View drift in hub
                    </Link>
                  </Button>
                ) : null}
                {hub.remediationInstances.totalCount > 0 ? (
                  <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-open-remediation-tab">
                    <Link
                      href={buildResourceHubWorkbenchHref({
                        cloudResourceId,
                        tab: "remediation",
                        snapshotId: resolvedSnapshotId,
                      })}
                    >
                      View remediation in hub
                    </Link>
                  </Button>
                ) : null}
                {hub.diagramCorrespondence != null ? (
                  <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-open-diagram-tab">
                    <Link href={buildHubDiagramTabHref(cloudResourceId, resolvedSnapshotId, runId)}>
                      Open diagram correspondence
                    </Link>
                  </Button>
                ) : null}
                <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-open-terraform-work">
                  <Link
                    href={buildResourceHubWorkbenchHref({
                      cloudResourceId,
                      tab: "terraform",
                      snapshotId: resolvedSnapshotId,
                    })}
                  >
                    Open terraform mapping
                  </Link>
                </Button>
                {resolvedAuditLineage != null ? (
                  <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-open-audit-work">
                    <Link
                      href={buildHubAuditLineageTabHref(cloudResourceId, resolvedSnapshotId, {
                        assessmentId: resolvedAuditLineage.assessmentId,
                        auditEvidenceSnapshotId: resolvedAuditLineage.auditEvidenceSnapshotId,
                        controlId: resolvedAuditLineage.controlId,
                      })}
                    >
                      Open audit lineage
                    </Link>
                  </Button>
                ) : null}
              </div>
            </section>

            <section className="rounded border border-border bg-card p-4">
              <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Current configuration</h2>
              {hub.currentConfiguration == null ? (
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>No snapshot-backed configuration is available.</p>
              ) : (
                <dl className="grid gap-2 text-sm">
                  <div>
                    <dt className="font-medium">Resource type</dt>
                    <dd>{hub.currentConfiguration.resourceType}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Resource group</dt>
                    <dd>{hub.currentConfiguration.resourceGroup ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Region</dt>
                    <dd>{hub.currentConfiguration.region ?? "—"}</dd>
                  </div>
                </dl>
              )}
            </section>

            {hub.recentChanges.length > 0 ? (
              <section className="rounded border border-border bg-card p-4">
                <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Recent changes</h2>
                <EnterpriseTable ariaLabel="Recent inventory changes">
                  <EnterpriseTableHead>
                    <EnterpriseTableRow>
                      <EnterpriseTableHeaderCell>Property</EnterpriseTableHeaderCell>
                      <EnterpriseTableHeaderCell>Change</EnterpriseTableHeaderCell>
                      <EnterpriseTableHeaderCell>Risk</EnterpriseTableHeaderCell>
                      <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
                    </EnterpriseTableRow>
                  </EnterpriseTableHead>
                  <EnterpriseTableBody>
                    {hub.recentChanges.map((change) => (
                      <EnterpriseTableRow key={change.changeId}>
                        <EnterpriseTableCell>
                          <Link
                            className="text-al-link hover:underline"
                            href={buildHubDriftChangeWorkbenchHref(cloudResourceId, resolvedSnapshotId, change)}
                            data-testid={`infra-resource-hub-drift-change-${change.changeId}`}
                          >
                            {change.property ?? change.changeType}
                          </Link>
                        </EnterpriseTableCell>
                        <EnterpriseTableCell>{change.changeType}</EnterpriseTableCell>
                        <EnterpriseTableCell>{change.riskClassification ?? "—"}</EnterpriseTableCell>
                        <EnterpriseTableCell>
                          <Button asChild size="sm" variant="outline">
                            <Link
                              href={buildHubDriftChangeAskHref(cloudResourceId, resolvedSnapshotId, change)}
                              data-testid={`infra-resource-hub-drift-ask-${change.changeId}`}
                            >
                              Ask
                            </Link>
                          </Button>
                        </EnterpriseTableCell>
                      </EnterpriseTableRow>
                    ))}
                  </EnterpriseTableBody>
                </EnterpriseTable>
              </section>
            ) : null}
          </EnterpriseTabsContent>

          <EnterpriseTabsContent value="drift" className="mt-4 space-y-3">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              Open the drift workbench with this resource&apos;s snapshot context prefilled.
            </p>
            <div className="flex flex-wrap gap-2">
              <HubOverviewTabLink
                cloudResourceId={cloudResourceId}
                resolvedSnapshotId={resolvedSnapshotId}
                runId={runId}
                testId="infra-resource-hub-drift-open-overview-tab"
              />
              <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-open-drift">
                <Link href={buildResourceHubDriftWorkbenchHref(resolvedSnapshotId, cloudResourceId)}>
                  Open drift workbench
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-drift-open-terraform">
                <Link
                  href={buildResourceHubWorkbenchHref({
                    cloudResourceId,
                    tab: "terraform",
                    snapshotId: resolvedSnapshotId,
                  })}
                >
                  Open terraform mapping
                </Link>
              </Button>
              {hub.diagramCorrespondence != null ? (
                <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-drift-open-diagram-tab">
                  <Link href={buildHubDiagramTabHref(cloudResourceId, resolvedSnapshotId, runId)}>
                    View diagram correspondence in hub
                  </Link>
                </Button>
              ) : null}
              {openFindingsCount > 0 ? (
                <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-drift-open-findings-tab">
                  <Link
                    href={buildResourceHubWorkbenchHref({
                      cloudResourceId,
                      tab: "findings",
                      snapshotId: resolvedSnapshotId,
                    })}
                  >
                    View findings in hub
                  </Link>
                </Button>
              ) : null}
              {hub.remediationInstances.totalCount > 0 ? (
                <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-drift-open-remediation-tab">
                  <Link
                    href={buildResourceHubWorkbenchHref({
                      cloudResourceId,
                      tab: "remediation",
                      snapshotId: resolvedSnapshotId,
                    })}
                  >
                    View remediation in hub
                  </Link>
                </Button>
              ) : null}
              {resolvedAuditLineage != null ? (
                <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-drift-open-audit-tab">
                  <Link
                    href={buildHubAuditLineageTabHref(cloudResourceId, resolvedSnapshotId, {
                      assessmentId: resolvedAuditLineage.assessmentId,
                      auditEvidenceSnapshotId: resolvedAuditLineage.auditEvidenceSnapshotId,
                      controlId: resolvedAuditLineage.controlId,
                    })}
                  >
                    View audit lineage in hub
                  </Link>
                </Button>
              ) : null}
            </div>
            {hub.recentChanges.length > 0 ? (
              <EnterpriseTable ariaLabel="Drift changes for resource">
                <EnterpriseTableHead>
                  <EnterpriseTableRow>
                    <EnterpriseTableHeaderCell>Property</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Old</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>New</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
                  </EnterpriseTableRow>
                </EnterpriseTableHead>
                <EnterpriseTableBody>
                  {hub.recentChanges.map((change) => (
                    <EnterpriseTableRow key={change.changeId}>
                      <EnterpriseTableCell>
                        <Link
                          className="text-al-link hover:underline"
                          href={buildHubDriftChangeWorkbenchHref(cloudResourceId, resolvedSnapshotId, change)}
                          data-testid={`infra-resource-hub-drift-tab-change-${change.changeId}`}
                        >
                          {change.property ?? change.changeType}
                        </Link>
                      </EnterpriseTableCell>
                      <EnterpriseTableCell className="font-mono text-xs">{change.oldValue ?? "—"}</EnterpriseTableCell>
                      <EnterpriseTableCell className="font-mono text-xs">{change.newValue ?? "—"}</EnterpriseTableCell>
                      <EnterpriseTableCell>
                        <Button asChild size="sm" variant="outline">
                          <Link
                            href={buildHubDriftChangeAskHref(cloudResourceId, resolvedSnapshotId, change)}
                            data-testid={`infra-resource-hub-drift-tab-ask-${change.changeId}`}
                          >
                            Ask
                          </Link>
                        </Button>
                      </EnterpriseTableCell>
                    </EnterpriseTableRow>
                  ))}
                </EnterpriseTableBody>
              </EnterpriseTable>
            ) : null}
          </EnterpriseTabsContent>

          <EnterpriseTabsContent value="diagram" className="mt-4 space-y-3">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              Review diagram correspondence and open inventory diagram or reconciliation workbenches.
            </p>
            <div className="flex flex-wrap gap-2">
              <HubOverviewTabLink
                cloudResourceId={cloudResourceId}
                resolvedSnapshotId={resolvedSnapshotId}
                runId={runId}
                testId="infra-resource-hub-diagram-open-overview-tab"
              />
              <Button asChild variant="outline" size="sm">
                <Link
                  href={buildResourceHubDiagramsWorkbenchHref(
                    resolvedSnapshotId,
                    cloudResourceId,
                    hub.externalResourceId,
                  )}
                  data-testid="infra-resource-hub-diagrams-workbench"
                >
                  Open inventory diagrams
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link
                  href={buildResourceHubDiagramReconcileWorkbenchHref(resolvedSnapshotId, runId, undefined, cloudResourceId)}
                  data-testid="infra-resource-hub-diagram-reconcile-workbench"
                >
                  Open diagram reconciliation
                </Link>
              </Button>
              {openFindingsCount > 0 ? (
                <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-diagram-open-findings-tab">
                  <Link
                    href={buildResourceHubWorkbenchHref({
                      cloudResourceId,
                      tab: "findings",
                      snapshotId: resolvedSnapshotId,
                    })}
                  >
                    View findings in hub
                  </Link>
                </Button>
              ) : null}
              {hub.recentChanges.length > 0 ? (
                <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-diagram-open-drift-tab">
                  <Link
                    href={buildResourceHubWorkbenchHref({
                      cloudResourceId,
                      tab: "drift",
                      snapshotId: resolvedSnapshotId,
                    })}
                  >
                    View drift in hub
                  </Link>
                </Button>
              ) : null}
              {hub.remediationInstances.totalCount > 0 ? (
                <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-diagram-open-remediation-tab">
                  <Link
                    href={buildResourceHubWorkbenchHref({
                      cloudResourceId,
                      tab: "remediation",
                      snapshotId: resolvedSnapshotId,
                    })}
                  >
                    View remediation in hub
                  </Link>
                </Button>
              ) : null}
              {hasTerraformMapping ? (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  data-testid="infra-resource-hub-diagram-open-terraform-tab"
                >
                  <Link
                    href={buildResourceHubWorkbenchHref({
                      cloudResourceId,
                      tab: "terraform",
                      snapshotId: resolvedSnapshotId,
                    })}
                  >
                    View terraform mapping in hub
                  </Link>
                </Button>
              ) : null}
              {resolvedAuditLineage != null ? (
                <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-diagram-open-audit-tab">
                  <Link
                    href={buildHubAuditLineageTabHref(cloudResourceId, resolvedSnapshotId, {
                      assessmentId: resolvedAuditLineage.assessmentId,
                      auditEvidenceSnapshotId: resolvedAuditLineage.auditEvidenceSnapshotId,
                      controlId: resolvedAuditLineage.controlId,
                    })}
                  >
                    View audit lineage in hub
                  </Link>
                </Button>
              ) : null}
            </div>
            {hub.diagramCorrespondence != null ? (
              <section className="rounded border border-border bg-card p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <StatusTag kind="needs-attention" label={hub.diagramCorrespondence.matchKind} />
                  <span className="text-sm text-muted-foreground">{hub.diagramCorrespondence.confidenceBand}</span>
                </div>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{hub.diagramCorrespondence.explainText}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-diagram-reconcile">
                    <Link
                      href={buildResourceHubDiagramReconcileWorkbenchHref(
                        resolvedSnapshotId,
                        runId,
                        hub.diagramCorrespondence.correspondenceId,
                        cloudResourceId,
                      )}
                    >
                      Open in reconciliation workbench
                    </Link>
                  </Button>
                  {diagramCorrespondenceRemediationHref != null ? (
                    <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-diagram-remediation">
                      <Link href={diagramCorrespondenceRemediationHref}>Open in remediation factory</Link>
                    </Button>
                  ) : null}
                  <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-diagram-ask">
                    <Link
                      href={buildHubDiagramCorrespondenceAskHref(
                        cloudResourceId,
                        resolvedSnapshotId,
                        runId,
                        hub.diagramCorrespondence.correspondenceId,
                      )}
                    >
                      Ask about this correspondence
                    </Link>
                  </Button>
                </div>
              </section>
            ) : (
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>No diagram correspondence row is linked for this resource.</p>
            )}
          </EnterpriseTabsContent>

          <EnterpriseTabsContent value="terraform" className="mt-4 space-y-3">
            <section className="rounded border border-border bg-card p-4">
              <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Advisory Terraform mapping</h2>
              <dl className="grid gap-2 text-sm">
                <div>
                  <dt className="font-medium">Terraform address</dt>
                  <dd className="font-mono text-xs">{hub.terraformAddress ?? "Not mapped"}</dd>
                </div>
                <div>
                  <dt className="font-medium">Generation method</dt>
                  <dd>{hub.terraformGenerationMethod ?? "—"}</dd>
                </div>
              </dl>
              <p className={cn("mt-3", OPERATOR_TYPOGRAPHY.helper)}>{TERRAFORM_ADVISORY_EXPORT_DISCLAIMER}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <HubOverviewTabLink
                  cloudResourceId={cloudResourceId}
                  resolvedSnapshotId={resolvedSnapshotId}
                  runId={runId}
                  testId="infra-resource-hub-terraform-open-overview-tab"
                />
                <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-terraform-drift-export">
                  <Link href={buildResourceHubDriftWorkbenchHref(resolvedSnapshotId, cloudResourceId)}>
                    Export from drift workbench
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-terraform-open-drift-tab">
                  <Link
                    href={buildResourceHubWorkbenchHref({
                      cloudResourceId,
                      tab: "drift",
                      snapshotId: resolvedSnapshotId,
                    })}
                  >
                    View drift in hub
                  </Link>
                </Button>
                {openFindingsCount > 0 ? (
                  <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-terraform-open-findings-tab">
                    <Link
                      href={buildResourceHubWorkbenchHref({
                        cloudResourceId,
                        tab: "findings",
                        snapshotId: resolvedSnapshotId,
                      })}
                    >
                      View findings in hub
                    </Link>
                  </Button>
                ) : null}
                {hub.remediationInstances.totalCount > 0 ? (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    data-testid="infra-resource-hub-terraform-open-remediation-tab"
                  >
                    <Link
                      href={buildResourceHubWorkbenchHref({
                        cloudResourceId,
                        tab: "remediation",
                        snapshotId: resolvedSnapshotId,
                      })}
                    >
                      View remediation in hub
                    </Link>
                  </Button>
                ) : null}
                {hub.diagramCorrespondence != null ? (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    data-testid="infra-resource-hub-terraform-open-diagram-tab"
                  >
                    <Link href={buildHubDiagramTabHref(cloudResourceId, resolvedSnapshotId, runId)}>
                      View diagram correspondence in hub
                    </Link>
                  </Button>
                ) : null}
              </div>
            </section>
          </EnterpriseTabsContent>

          <EnterpriseTabsContent value="findings" className="mt-4 space-y-4">
            {findingActionMessage != null ? (
              <p className={cn("m-0 text-sm", OPERATOR_TYPOGRAPHY.helper)} role="status">{findingActionMessage}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <HubOverviewTabLink
                cloudResourceId={cloudResourceId}
                resolvedSnapshotId={resolvedSnapshotId}
                runId={runId}
                testId="infra-resource-hub-findings-open-overview-tab"
              />
              <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-findings-open-remediation-tab">
                <Link
                  href={buildResourceHubWorkbenchHref({
                    cloudResourceId,
                    tab: "remediation",
                    snapshotId: resolvedSnapshotId,
                  })}
                >
                  View remediation in hub
                </Link>
              </Button>
              {resolvedAuditLineage != null ? (
                <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-findings-open-audit-tab">
                  <Link
                    href={buildHubAuditLineageTabHref(cloudResourceId, resolvedSnapshotId, {
                      assessmentId: resolvedAuditLineage.assessmentId,
                      auditEvidenceSnapshotId: resolvedAuditLineage.auditEvidenceSnapshotId,
                      controlId: resolvedAuditLineage.controlId,
                    })}
                  >
                    View audit lineage in hub
                  </Link>
                </Button>
              ) : null}
              {hub.recentChanges.length > 0 ? (
                <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-findings-open-drift-tab">
                  <Link
                    href={buildResourceHubWorkbenchHref({
                      cloudResourceId,
                      tab: "drift",
                      snapshotId: resolvedSnapshotId,
                    })}
                  >
                    View drift in hub
                  </Link>
                </Button>
              ) : null}
              {hasTerraformMapping ? (
                <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-findings-open-terraform-tab">
                  <Link
                    href={buildResourceHubWorkbenchHref({
                      cloudResourceId,
                      tab: "terraform",
                      snapshotId: resolvedSnapshotId,
                    })}
                  >
                    View terraform mapping in hub
                  </Link>
                </Button>
              ) : null}
            </div>
            {[hub.operationalSecurityFindings, hub.architectureReviewFindings].map((stream) => (
              <section key={stream.streamKind} className="rounded border border-border bg-card p-4">
                <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>{stream.streamLabel}</h2>
                {stream.items.length === 0 ? (
                  <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>No findings in this stream.</p>
                ) : (
                  <EnterpriseTable ariaLabel={`${stream.streamLabel} findings`}>
                    <EnterpriseTableHead>
                      <EnterpriseTableRow>
                        <EnterpriseTableHeaderCell>Title</EnterpriseTableHeaderCell>
                        <EnterpriseTableHeaderCell>Severity</EnterpriseTableHeaderCell>
                        <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
                        <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
                      </EnterpriseTableRow>
                    </EnterpriseTableHead>
                    <EnterpriseTableBody>
                      {stream.items.map((item) => (
                        <EnterpriseTableRow key={`${stream.streamKind}-${item.id}`}>
                          <EnterpriseTableCell>{item.title}</EnterpriseTableCell>
                          <EnterpriseTableCell>{item.severity ?? "—"}</EnterpriseTableCell>
                          <EnterpriseTableCell>{item.status ?? "—"}</EnterpriseTableCell>
                          <EnterpriseTableCell>
                            {stream.streamKind === "OperationalSecurity" ? (
                              <div className="flex flex-wrap gap-2">
                                <Button asChild size="sm" variant="outline">
                                  <Link
                                    href={buildRemediationWorkbenchHref({
                                      cloudResourceId,
                                      findingId: item.id,
                                      snapshotId: resolvedSnapshotId,
                                    })}
                                    data-testid={`infra-resource-hub-finding-factory-${item.id}`}
                                  >
                                    Open in factory
                                  </Link>
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  data-testid={`infra-resource-hub-match-${item.id}`}
                                  disabled={findingActionBusyId === item.id}
                                  onClick={() => void runMatchRemediationFromFinding(item.id)}
                                >
                                  {findingActionBusyId === item.id ? "Matching…" : "Match remediation"}
                                </Button>
                                <Button asChild size="sm" variant="outline">
                                  <Link
                                    href={buildHubFindingAskHref(cloudResourceId, resolvedSnapshotId, item.id)}
                                    data-testid={`infra-resource-hub-finding-ask-${item.id}`}
                                  >
                                    Ask
                                  </Link>
                                </Button>
                              </div>
                            ) : (
                              <Button asChild size="sm" variant="outline">
                                <Link
                                  href={buildHubFindingAskHref(cloudResourceId, resolvedSnapshotId, item.id)}
                                  data-testid={`infra-resource-hub-architecture-finding-ask-${item.id}`}
                                >
                                  Ask
                                </Link>
                              </Button>
                            )}
                          </EnterpriseTableCell>
                        </EnterpriseTableRow>
                      ))}
                    </EnterpriseTableBody>
                  </EnterpriseTable>
                )}
              </section>
            ))}
          </EnterpriseTabsContent>

          <EnterpriseTabsContent value="remediation" className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <HubOverviewTabLink
                cloudResourceId={cloudResourceId}
                resolvedSnapshotId={resolvedSnapshotId}
                runId={runId}
                testId="infra-resource-hub-remediation-open-overview-tab"
              />
              <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-open-remediation-factory">
                <Link href={buildRemediationWorkbenchHref({ cloudResourceId, snapshotId: resolvedSnapshotId })}>
                  Open remediation factory
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-remediation-open-findings-tab">
                <Link
                  href={buildResourceHubWorkbenchHref({
                    cloudResourceId,
                    tab: "findings",
                    snapshotId: resolvedSnapshotId,
                  })}
                >
                  View findings in hub
                </Link>
              </Button>
              {hub.diagramCorrespondence != null ? (
                <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-remediation-open-diagram-tab">
                  <Link href={buildHubDiagramTabHref(cloudResourceId, resolvedSnapshotId, runId)}>
                    View diagram correspondence in hub
                  </Link>
                </Button>
              ) : null}
              {hub.recentChanges.length > 0 ? (
                <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-remediation-open-drift-tab">
                  <Link
                    href={buildResourceHubWorkbenchHref({
                      cloudResourceId,
                      tab: "drift",
                      snapshotId: resolvedSnapshotId,
                    })}
                  >
                    View drift in hub
                  </Link>
                </Button>
              ) : null}
              {hasTerraformMapping ? (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  data-testid="infra-resource-hub-remediation-open-terraform-tab"
                >
                  <Link
                    href={buildResourceHubWorkbenchHref({
                      cloudResourceId,
                      tab: "terraform",
                      snapshotId: resolvedSnapshotId,
                    })}
                  >
                    View terraform mapping in hub
                  </Link>
                </Button>
              ) : null}
              {resolvedAuditLineage != null ? (
                <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-remediation-open-audit-tab">
                  <Link
                    href={buildHubAuditLineageTabHref(cloudResourceId, resolvedSnapshotId, {
                      assessmentId: resolvedAuditLineage.assessmentId,
                      auditEvidenceSnapshotId: resolvedAuditLineage.auditEvidenceSnapshotId,
                      controlId: resolvedAuditLineage.controlId,
                    })}
                  >
                    View audit lineage in hub
                  </Link>
                </Button>
              ) : null}
            </div>
            {hub.remediationInstances.items.length === 0 ? (
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>No remediation instances are linked to this resource.</p>
            ) : (
              <EnterpriseTable ariaLabel="Remediation instances">
                <EnterpriseTableHead>
                  <EnterpriseTableRow>
                    <EnterpriseTableHeaderCell>Pattern</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
                  </EnterpriseTableRow>
                </EnterpriseTableHead>
                <EnterpriseTableBody>
                  {hub.remediationInstances.items.map((item) => (
                    <EnterpriseTableRow key={item.instanceId}>
                      <EnterpriseTableCell>{item.patternKey}</EnterpriseTableCell>
                      <EnterpriseTableCell>{item.status}</EnterpriseTableCell>
                      <EnterpriseTableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link
                              href={buildRemediationWorkbenchHref({
                                cloudResourceId,
                                instanceId: item.instanceId,
                                snapshotId: resolvedSnapshotId,
                              })}
                              data-testid={`infra-resource-hub-remediation-factory-${item.instanceId}`}
                            >
                              Open in factory
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <Link
                              href={buildHubRemediationAskHref(cloudResourceId, resolvedSnapshotId, item.instanceId)}
                              data-testid={`infra-resource-hub-remediation-ask-${item.instanceId}`}
                            >
                              Ask
                            </Link>
                          </Button>
                        </div>
                      </EnterpriseTableCell>
                    </EnterpriseTableRow>
                  ))}
                </EnterpriseTableBody>
              </EnterpriseTable>
            )}
          </EnterpriseTabsContent>

          <EnterpriseTabsContent value="audit" className="mt-4 space-y-3">
            {resolvedAuditLineage != null ? (
              <>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                  AE-10 chain of custody for {resolvedAuditLineage.label}.
                </p>
                <div className="flex flex-wrap gap-2">
                  <HubOverviewTabLink
                    cloudResourceId={cloudResourceId}
                    resolvedSnapshotId={resolvedSnapshotId}
                    runId={runId}
                    testId="infra-resource-hub-audit-open-overview-tab"
                  />
                  <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-audit-lineage-link">
                    <Link
                      href={buildAuditEvidenceLineageUiPath(
                        resolvedAuditLineage.assessmentId,
                        resolvedAuditLineage.auditEvidenceSnapshotId,
                        resolvedAuditLineage.controlId,
                      )}
                    >
                      Open audit control lineage
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-audit-ask">
                    <Link
                      href={buildHubAuditLineageAskHref(cloudResourceId, resolvedSnapshotId, {
                        assessmentId: resolvedAuditLineage.assessmentId,
                        auditEvidenceSnapshotId: resolvedAuditLineage.auditEvidenceSnapshotId,
                        controlId: resolvedAuditLineage.controlId,
                      })}
                    >
                      Ask about this control
                    </Link>
                  </Button>
                  {openFindingsCount > 0 ? (
                    <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-audit-open-findings-tab">
                      <Link
                        href={buildResourceHubWorkbenchHref({
                          cloudResourceId,
                          tab: "findings",
                          snapshotId: resolvedSnapshotId,
                        })}
                      >
                        View findings in hub
                      </Link>
                    </Button>
                  ) : null}
                  {hub.diagramCorrespondence != null ? (
                    <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-audit-open-diagram-tab">
                      <Link href={buildHubDiagramTabHref(cloudResourceId, resolvedSnapshotId, runId)}>
                        View diagram correspondence in hub
                      </Link>
                    </Button>
                  ) : null}
                  {hasTerraformMapping ? (
                    <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-audit-open-terraform-tab">
                      <Link
                        href={buildResourceHubWorkbenchHref({
                          cloudResourceId,
                          tab: "terraform",
                          snapshotId: resolvedSnapshotId,
                        })}
                      >
                        View terraform mapping in hub
                      </Link>
                    </Button>
                  ) : null}
                </div>
                {resolvedAuditLineage.matches.length > 1 ? (
                  <section className="rounded border border-border bg-card p-4" aria-label="Additional audit controls">
                    <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Other linked controls</h2>
                    <ul className="m-0 list-disc space-y-2 pl-5 text-sm">
                      {resolvedAuditLineage.matches.slice(1).map((match: CloudResourceAuditLineageMatch) => (
                        <li key={`${match.controlId}-${match.auditEvidenceSnapshotId}`}>
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              className="text-al-link hover:underline"
                              href={buildAuditEvidenceLineageUiPath(
                                match.assessmentId,
                                match.auditEvidenceSnapshotId,
                                match.controlId,
                              )}
                            >
                              {match.controlNumber} · {match.controlTitle}
                            </Link>
                            <Link
                              className="text-sm text-al-link hover:underline"
                              href={buildHubAuditLineageAskHref(cloudResourceId, resolvedSnapshotId, {
                                assessmentId: match.assessmentId,
                                auditEvidenceSnapshotId: match.auditEvidenceSnapshotId,
                                controlId: match.controlId,
                              })}
                              data-testid={`infra-resource-hub-audit-ask-${match.controlId}`}
                            >
                              Ask
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </>
            ) : (
              <section
                className="rounded border border-dashed border-border bg-muted/20 p-4"
                data-testid="infra-resource-hub-audit-degraded"
              >
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                  {hub.auditLineageLink.degradedReason ??
                    "No audit evidence snapshot rows reference this cloud resource yet."}
                </p>
              </section>
            )}
          </EnterpriseTabsContent>
        </EnterpriseTabs>
      ) : null}
    </div>
  );
}
