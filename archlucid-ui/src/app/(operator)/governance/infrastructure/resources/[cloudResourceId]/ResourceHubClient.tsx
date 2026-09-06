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
import { GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import {
  buildAuditEvidenceLineageUiPath,
  buildResourceHubDiagramReconcileWorkbenchHref,
  buildResourceHubDiagramsWorkbenchHref,
  buildResourceHubDriftWorkbenchHref,
} from "@/lib/infra-evidence/infra-evidence-ask-citations";
import {
  fetchCloudResourceEvidenceHub,
  formatInfraEvidenceHubApiError,
} from "@/lib/infra-evidence/infra-evidence-hub-api";
import {
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
            {HUB_TABS.map((tab) => (
              <EnterpriseTabsTrigger key={tab.id} value={tab.id} data-testid={`infra-resource-hub-tab-${tab.id}`}>
                {tab.label}
              </EnterpriseTabsTrigger>
            ))}
          </EnterpriseTabsList>

          <EnterpriseTabsContent value="overview" className="mt-4 space-y-4">
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
              <Link href={buildResourceHubDriftWorkbenchHref(resolvedSnapshotId)}>Open drift workbench</Link>
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
                      </EnterpriseTableRow>
                    </EnterpriseTableHead>
                    <EnterpriseTableBody>
                      {stream.items.map((item) => (
                        <EnterpriseTableRow key={`${stream.streamKind}-${item.id}`}>
                          <EnterpriseTableCell>{item.title}</EnterpriseTableCell>
                          <EnterpriseTableCell>{item.severity ?? "—"}</EnterpriseTableCell>
                          <EnterpriseTableCell>{item.status ?? "—"}</EnterpriseTableCell>
                        </EnterpriseTableRow>
                      ))}
                    </EnterpriseTableBody>
                  </EnterpriseTable>
                )}
              </section>
            ))}
          </EnterpriseTabsContent>

          <EnterpriseTabsContent value="remediation" className="mt-4 space-y-3">
            {hub.remediationInstances.items.length === 0 ? (
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>No remediation instances are linked to this resource.</p>
            ) : (
              <EnterpriseTable ariaLabel="Remediation instances">
                <EnterpriseTableHead>
                  <EnterpriseTableRow>
                    <EnterpriseTableHeaderCell>Pattern</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
                  </EnterpriseTableRow>
                </EnterpriseTableHead>
                <EnterpriseTableBody>
                  {hub.remediationInstances.items.map((item) => (
                    <EnterpriseTableRow key={item.instanceId}>
                      <EnterpriseTableCell>{item.patternKey}</EnterpriseTableCell>
                      <EnterpriseTableCell>{item.status}</EnterpriseTableCell>
                    </EnterpriseTableRow>
                  ))}
                </EnterpriseTableBody>
              </EnterpriseTable>
            )}
          </EnterpriseTabsContent>

          <EnterpriseTabsContent value="audit" className="mt-4 space-y-3">
            {hub.auditLineageLink.available &&
            assessmentId.length > 0 &&
            auditEvidenceSnapshotId.length > 0 &&
            controlId.length > 0 ? (
              <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-audit-lineage-link">
                <Link
                  href={buildAuditEvidenceLineageUiPath(assessmentId, auditEvidenceSnapshotId, controlId)}
                >
                  Open audit control lineage
                </Link>
              </Button>
            ) : (
              <section
                className="rounded border border-dashed border-border bg-muted/20 p-4"
                data-testid="infra-resource-hub-audit-degraded"
              >
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                  {hub.auditLineageLink.degradedReason ??
                    "Provide assessmentId, auditEvidenceSnapshotId, and controlId query parameters to link AE-10 audit lineage."}
                </p>
              </section>
            )}
          </EnterpriseTabsContent>
        </EnterpriseTabs>
      ) : null}
    </div>
  );
}
