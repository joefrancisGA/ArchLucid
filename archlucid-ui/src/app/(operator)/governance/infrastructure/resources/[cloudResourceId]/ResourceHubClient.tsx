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
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import {
  buildAuditEvidenceLineageUiPath,
  buildResourceHubDiagramReconcileWorkbenchHref,
  buildResourceHubDiagramsWorkbenchHref,
  buildResourceHubDriftWorkbenchHref,
} from "@/lib/infra-evidence/infra-evidence-ask-citations";
import {
  buildRemediationWorkbenchHref,
  buildResourceScopedWorkbenchHref,
} from "@/lib/infra-evidence/infra-evidence-workbench-url";
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
                <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-open-findings-work">
                  <Link href={buildResourceScopedWorkbenchHref(cloudResourceId, "findings", resolvedSnapshotId)}>
                    Open findings
                  </Link>
                </Button>
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
                    </EnterpriseTableRow>
                  </EnterpriseTableHead>
                  <EnterpriseTableBody>
                    {hub.recentChanges.map((change) => (
                      <EnterpriseTableRow key={change.changeId}>
                        <EnterpriseTableCell>{change.property ?? "—"}</EnterpriseTableCell>
                        <EnterpriseTableCell>{change.changeType}</EnterpriseTableCell>
                        <EnterpriseTableCell>{change.riskClassification ?? "—"}</EnterpriseTableCell>
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
            <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-open-drift">
              <Link href={buildResourceHubDriftWorkbenchHref(resolvedSnapshotId, cloudResourceId)}>
                Open drift workbench
              </Link>
            </Button>
            {hub.recentChanges.length > 0 ? (
              <EnterpriseTable ariaLabel="Drift changes for resource">
                <EnterpriseTableHead>
                  <EnterpriseTableRow>
                    <EnterpriseTableHeaderCell>Property</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Old</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>New</EnterpriseTableHeaderCell>
                  </EnterpriseTableRow>
                </EnterpriseTableHead>
                <EnterpriseTableBody>
                  {hub.recentChanges.map((change) => (
                    <EnterpriseTableRow key={change.changeId}>
                      <EnterpriseTableCell>{change.property ?? "—"}</EnterpriseTableCell>
                      <EnterpriseTableCell className="font-mono text-xs">{change.oldValue ?? "—"}</EnterpriseTableCell>
                      <EnterpriseTableCell className="font-mono text-xs">{change.newValue ?? "—"}</EnterpriseTableCell>
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
              <Button asChild variant="outline" size="sm">
                <Link href={buildResourceHubDiagramsWorkbenchHref(resolvedSnapshotId)}>Open inventory diagrams</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={buildResourceHubDiagramReconcileWorkbenchHref(resolvedSnapshotId, runId)}>
                  Open diagram reconciliation
                </Link>
              </Button>
            </div>
            {hub.diagramCorrespondence != null ? (
              <section className="rounded border border-border bg-card p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <StatusTag kind="needs-attention" label={hub.diagramCorrespondence.matchKind} />
                  <span className="text-sm text-muted-foreground">{hub.diagramCorrespondence.confidenceBand}</span>
                </div>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{hub.diagramCorrespondence.explainText}</p>
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
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link href={buildResourceHubDriftWorkbenchHref(resolvedSnapshotId)}>Export from drift workbench</Link>
              </Button>
            </section>
          </EnterpriseTabsContent>

          <EnterpriseTabsContent value="findings" className="mt-4 space-y-4">
            {findingActionMessage != null ? (
              <p className={cn("m-0 text-sm", OPERATOR_TYPOGRAPHY.helper)} role="status">{findingActionMessage}</p>
            ) : null}
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
                        {stream.streamKind === "OperationalSecurity" ? (
                          <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
                        ) : null}
                      </EnterpriseTableRow>
                    </EnterpriseTableHead>
                    <EnterpriseTableBody>
                      {stream.items.map((item) => (
                        <EnterpriseTableRow key={`${stream.streamKind}-${item.id}`}>
                          <EnterpriseTableCell>{item.title}</EnterpriseTableCell>
                          <EnterpriseTableCell>{item.severity ?? "—"}</EnterpriseTableCell>
                          <EnterpriseTableCell>{item.status ?? "—"}</EnterpriseTableCell>
                          {stream.streamKind === "OperationalSecurity" ? (
                            <EnterpriseTableCell>
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
                            </EnterpriseTableCell>
                          ) : null}
                        </EnterpriseTableRow>
                      ))}
                    </EnterpriseTableBody>
                  </EnterpriseTable>
                )}
              </section>
            ))}
          </EnterpriseTabsContent>

          <EnterpriseTabsContent value="remediation" className="mt-4 space-y-3">
            <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-open-remediation-factory">
              <Link href={buildRemediationWorkbenchHref({ cloudResourceId })}>Open remediation factory</Link>
            </Button>
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
                        <Button asChild size="sm" variant="outline">
                          <Link
                            href={`${GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH}?instanceId=${encodeURIComponent(item.instanceId)}`}
                          >
                            Open in factory
                          </Link>
                        </Button>
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
                {resolvedAuditLineage.matches.length > 1 ? (
                  <section className="rounded border border-border bg-card p-4" aria-label="Additional audit controls">
                    <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Other linked controls</h2>
                    <ul className="m-0 list-disc space-y-2 pl-5 text-sm">
                      {resolvedAuditLineage.matches.slice(1).map((match: CloudResourceAuditLineageMatch) => (
                        <li key={`${match.controlId}-${match.auditEvidenceSnapshotId}`}>
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
