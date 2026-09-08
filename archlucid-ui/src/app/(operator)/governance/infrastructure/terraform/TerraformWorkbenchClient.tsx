"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { CopyScopedOperatorLinkButton } from "@/components/CopyScopedOperatorLinkButton";
import { InfraEvidenceSelectionAnnouncer } from "@/components/infra-evidence/InfraEvidenceSelectionAnnouncer";
import { LayerHeader } from "@/components/LayerHeader";
import { WorkbenchAuditLineageStatus } from "@/components/infra-evidence/WorkbenchAuditLineageStatus";
import { WorkbenchHubScopeLinks } from "@/components/infra-evidence/WorkbenchHubScopeLinks";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { buildAdvisoryTerraformResourceSnippet } from "@/lib/infra-evidence/build-advisory-terraform-resource-snippet";
import { downloadInfraEvidenceTerraformAdvisoryZip } from "@/lib/infra-evidence/infra-evidence-drift-api";
import {
  formatInfraEvidenceHubApiError,
} from "@/lib/infra-evidence/infra-evidence-hub-api";
import { buildInfrastructureAskHref, resourceHubFilterHrefFromSearch } from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import type { CloudResourceEvidenceHubResponse } from "@/lib/infra-evidence/infra-evidence-hub-types";
import { buildTerraformWorkbenchHref, INFRA_TERRAFORM_CLOUD_RESOURCE_ID_PARAM, INFRA_TERRAFORM_SNAPSHOT_ID_PARAM } from "@/lib/infra-evidence/infra-evidence-terraform-filter-url";
import {
  fetchCachedInfraEvidenceResourceHub,
} from "@/lib/infra-evidence/infra-evidence-resource-hub-cache";
import { buildInfraEvidenceAuditControlOptions, buildInfraEvidenceAuditControlScopePatch } from "@/lib/infra-evidence/infra-evidence-audit-control-options";
import type { CloudResourceAuditLineageMatch } from "@/lib/infra-evidence/infra-evidence-hub-types";
import {
  hasStaleInfraEvidenceAuditUrlParams,
  mergeInfrastructureAskAuditScope,
  mergeWorkbenchHubScopePatch,
  parseInfraEvidenceWorkbenchAuditScopeFromSearch,
} from "@/lib/infra-evidence/infra-evidence-workbench-hub-scope";
import {
  buildDriftWorkbenchHref,
  buildResourceHubWorkbenchHref,
  parseInfraEvidenceWorkbenchQueryValue,
} from "@/lib/infra-evidence/infra-evidence-workbench-url";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { TERRAFORM_ADVISORY_EXPORT_DISCLAIMER } from "@/lib/terraform-advisory-disclaimer";
import { cn } from "@/lib/utils";

export function TerraformWorkbenchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSnapshotId = parseInfraEvidenceWorkbenchQueryValue(searchParams.get(INFRA_TERRAFORM_SNAPSHOT_ID_PARAM));
  const urlCloudResourceId = parseInfraEvidenceWorkbenchQueryValue(
    searchParams.get(INFRA_TERRAFORM_CLOUD_RESOURCE_ID_PARAM),
  );

  const [hub, setHub] = useState<CloudResourceEvidenceHubResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [exportBusy, setExportBusy] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const auditScope = useMemo(() => parseInfraEvidenceWorkbenchAuditScopeFromSearch(searchParams), [searchParams]);
  const hasStaleAuditUrlParams = useMemo(
    () => hasStaleInfraEvidenceAuditUrlParams(searchParams),
    [searchParams],
  );
  const resolvedSnapshotId = useMemo(() => {
    if (urlSnapshotId.length > 0) {
      return urlSnapshotId;
    }

    return hub?.currentConfiguration?.snapshotId?.trim() ?? "";
  }, [hub, urlSnapshotId]);

  const workbenchHubScopePatch = useMemo(
    () => mergeWorkbenchHubScopePatch(resolvedSnapshotId, auditScope),
    [auditScope, resolvedSnapshotId],
  );
  const auditControlOptions = useMemo(
    () => buildInfraEvidenceAuditControlOptions(hub),
    [hub],
  );
  const onAuditControlChange = useCallback((match: CloudResourceAuditLineageMatch) => {
    router.replace(buildTerraformWorkbenchHref({
      cloudResourceId: urlCloudResourceId,
      snapshotId: resolvedSnapshotId.length > 0 ? resolvedSnapshotId : null,
      ...buildInfraEvidenceAuditControlScopePatch(match),
    }));
  }, [resolvedSnapshotId, router, urlCloudResourceId]);
  const deepLinkedSnapshotMissing = useMemo(() => {
    if (urlSnapshotId.length === 0 || loading || hub == null) {
      return false;
    }

    const hubSnapshotId = hub.currentConfiguration?.snapshotId?.trim() ?? "";

    return hubSnapshotId.length > 0 && hubSnapshotId !== urlSnapshotId;
  }, [hub, loading, urlSnapshotId]);
  const selectionAnnouncement = useMemo(() => {
    if (resolvedSnapshotId.length === 0) {
      return null;
    }

    return `Terraform advisory scoped to snapshot ${resolvedSnapshotId}.`;
  }, [resolvedSnapshotId]);

  useEffect(() => {
    if (urlCloudResourceId.length === 0) {
      setHub(null);
      setLoadError(null);
      setLoading(false);

      return;
    }

    let cancelled = false;

    async function loadHub() {
      setLoading(true);
      setLoadError(null);

      try {
        const response = await fetchCachedInfraEvidenceResourceHub(urlCloudResourceId, {
          snapshotId: urlSnapshotId.length > 0 ? urlSnapshotId : undefined,
        });

        if (!cancelled) {
          setHub(response);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setHub(null);
          setLoadError(formatInfraEvidenceHubApiError(error));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadHub();

    return () => {
      cancelled = true;
    };
  }, [urlCloudResourceId, urlSnapshotId]);

  const terraformAskHref = useMemo(() => {
    if (urlCloudResourceId.length === 0) {
      return null;
    }

    return buildInfrastructureAskHref({
      cloudResourceId: urlCloudResourceId,
      snapshotId: resolvedSnapshotId.length > 0 ? resolvedSnapshotId : undefined,
      hubTab: "terraform",
      ...mergeInfrastructureAskAuditScope(auditScope),
    });
  }, [auditScope, resolvedSnapshotId, urlCloudResourceId]);

  const advisorySnippet = useMemo(
    () => (hub != null ? buildAdvisoryTerraformResourceSnippet(hub) : null),
    [hub],
  );

  const hasTerraformMapping = useMemo(() => {
    const terraformAddress = hub?.terraformAddress?.trim() ?? "";

    return terraformAddress.length > 0;
  }, [hub]);

  const runAdvisoryExport = async () => {
    if (resolvedSnapshotId.length === 0) {
      return;
    }

    setExportBusy(true);

    try {
      await downloadInfraEvidenceTerraformAdvisoryZip(resolvedSnapshotId);
    } finally {
      setExportBusy(false);
    }
  };

  const copyAdvisorySnippet = async () => {
    if (advisorySnippet == null) {
      return;
    }

    if (typeof navigator === "undefined" || navigator.clipboard?.writeText == null) {
      setCopyMessage("Clipboard is unavailable in this browser.");
      return;
    }

    await navigator.clipboard.writeText(advisorySnippet);
    setCopyMessage("Copied advisory snippet.");
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6" data-testid="infra-terraform-workbench">
      <LayerHeader pageKey="infrastructure-terraform" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          Review advisory Terraform mapping reconstructed from inventory evidence. This is not original Terraform and must
          not be applied without human review.
        </p>
        <CopyScopedOperatorLinkButton testId="infra-terraform-copy-scoped-link" />
      </div>
      <InfraEvidenceSelectionAnnouncer message={selectionAnnouncement} testId="infra-terraform-selection-announcer" />

      {deepLinkedSnapshotMissing ? (
        <p
          className={cn("m-0 text-sm text-muted-foreground", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="infra-terraform-snapshot-deep-link-missing"
          role="status"
        >
          The linked snapshot is not available for this scoped resource.
        </p>
      ) : null}

      {loadError != null ? <StatusTag kind="needs-attention" label={loadError} /> : null}

      {urlCloudResourceId.length > 0 ? (
        <section
          className="rounded border border-border bg-card p-4"
          data-testid="infra-terraform-resource-scope-banner"
          aria-label="Terraform workbench resource scope"
        >
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
            Scoped to resource <span className="font-mono text-xs">{urlCloudResourceId}</span>.
          </p>
          {(auditScope != null || hub?.auditLineageLink.available === false || hasStaleAuditUrlParams) ? (
            <WorkbenchAuditLineageStatus
              auditScope={auditScope}
              hub={hub}
              cloudResourceId={urlCloudResourceId}
              currentSearch={searchParams.toString()}
              snapshotId={resolvedSnapshotId}
              activeTab="terraform"
              hasStaleAuditUrlParams={hasStaleAuditUrlParams}
              auditControlOptions={auditControlOptions}
              onAuditControlChange={onAuditControlChange}
              provenanceTestId="infra-terraform-audit-provenance"
              unavailableTestId="infra-terraform-audit-unavailable"
            />
          ) : null}
          <WorkbenchHubScopeLinks
            cloudResourceId={urlCloudResourceId}
            primaryTab="terraform"
            primaryHref={resourceHubFilterHrefFromSearch(urlCloudResourceId, "", {
              tab: "terraform",
              ...workbenchHubScopePatch,
            })}
            primaryTestId="infra-terraform-open-primary-hub"
            siblingTestIdPrefix="infra-terraform"
            scopePatch={workbenchHubScopePatch}
            siblingTabs={["drift", "findings", "remediation", "diagram"]}
            includeAuditTab={auditScope != null}
            extraLinks={[
              {
                testId: "infra-terraform-open-drift-workbench",
                href: buildDriftWorkbenchHref({
                  cloudResourceId: urlCloudResourceId,
                  snapshotId: resolvedSnapshotId.length > 0 ? resolvedSnapshotId : null,
                  assessmentId: auditScope?.assessmentId ?? null,
                  auditEvidenceSnapshotId: auditScope?.auditEvidenceSnapshotId ?? null,
                  controlId: auditScope?.controlId ?? null,
                }),
                label: "Open drift workbench",
              },
            ]}
          />
        </section>
      ) : null}

      {loading ? (
        <p className={cn("m-0 inline-flex items-center gap-2", OPERATOR_TYPOGRAPHY.helper)}>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading advisory Terraform mapping…
        </p>
      ) : null}

      {hub != null && !hasTerraformMapping ? (
        <section
          className="rounded border border-dashed border-border bg-muted/20 p-4"
          data-testid="infra-terraform-empty-state"
          aria-label="No Terraform mapping"
        >
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
            No advisory Terraform address is mapped for this resource in the selected snapshot.
          </p>
        </section>
      ) : null}

      {hub != null && hasTerraformMapping ? (
        <section className="rounded border border-border bg-card p-4" aria-label="Advisory Terraform mapping">
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
            <div>
              <dt className="font-medium">Snapshot</dt>
              <dd className="font-mono text-xs">{resolvedSnapshotId.length > 0 ? resolvedSnapshotId : "—"}</dd>
            </div>
          </dl>
          {advisorySnippet != null ? (
            <div className="mt-4">
              <h3 className="text-sm font-medium">Advisory snippet preview</h3>
              <pre
                className="mt-2 overflow-x-auto rounded border border-border bg-muted/30 p-3 font-mono text-xs"
                data-testid="infra-terraform-snippet-preview"
              >
                {advisorySnippet}
              </pre>
            </div>
          ) : null}
          <p className={cn("mt-3", OPERATOR_TYPOGRAPHY.helper)}>{TERRAFORM_ADVISORY_EXPORT_DISCLAIMER}</p>
          {copyMessage != null ? (
            <p className={cn("m-0 mt-2 text-sm text-muted-foreground", OPERATOR_TYPOGRAPHY.helper)} role="status">
              {copyMessage}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {advisorySnippet != null ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="infra-terraform-copy-snippet"
                onClick={() => void copyAdvisorySnippet()}
              >
                Copy advisory snippet
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="infra-terraform-download-advisory-zip"
              disabled={exportBusy || resolvedSnapshotId.length === 0}
              onClick={() => void runAdvisoryExport()}
            >
              {exportBusy ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Exporting…
                </span>
              ) : (
                "Download advisory ZIP"
              )}
            </Button>
            <Button asChild variant="outline" size="sm" data-testid="infra-terraform-open-drift-export">
              <Link
                href={buildDriftWorkbenchHref({
                  cloudResourceId: urlCloudResourceId,
                  snapshotId: resolvedSnapshotId.length > 0 ? resolvedSnapshotId : null,
                  assessmentId: auditScope?.assessmentId ?? null,
                  auditEvidenceSnapshotId: auditScope?.auditEvidenceSnapshotId ?? null,
                  controlId: auditScope?.controlId ?? null,
                })}
              >
                Export from drift workbench
              </Link>
            </Button>
            {terraformAskHref != null ? (
              <Button asChild variant="outline" size="sm" data-testid="infra-terraform-open-ask">
                <Link href={terraformAskHref}>Ask about this mapping</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" size="sm" data-testid="infra-terraform-open-findings-hub">
              <Link
                href={buildResourceHubWorkbenchHref({
                  cloudResourceId: urlCloudResourceId,
                  tab: "findings",
                  ...workbenchHubScopePatch,
                })}
              >
                View findings in hub
              </Link>
            </Button>
          </div>
        </section>
      ) : null}

      {urlCloudResourceId.length === 0 ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          Open this workbench from a scoped resource hub or explorer row to review advisory Terraform mapping.
        </p>
      ) : null}
    </div>
  );
}
