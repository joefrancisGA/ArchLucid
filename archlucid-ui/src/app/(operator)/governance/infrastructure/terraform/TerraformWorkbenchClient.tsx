"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { LayerHeader } from "@/components/LayerHeader";
import { WorkbenchAuditProvenance } from "@/components/infra-evidence/WorkbenchAuditProvenance";
import { WorkbenchHubScopeLinks } from "@/components/infra-evidence/WorkbenchHubScopeLinks";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  fetchCloudResourceEvidenceHub,
  formatInfraEvidenceHubApiError,
} from "@/lib/infra-evidence/infra-evidence-hub-api";
import { buildInfrastructureAskHref, resourceHubFilterHrefFromSearch } from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import type { CloudResourceEvidenceHubResponse } from "@/lib/infra-evidence/infra-evidence-hub-types";
import {
  INFRA_TERRAFORM_CLOUD_RESOURCE_ID_PARAM,
  INFRA_TERRAFORM_SNAPSHOT_ID_PARAM,
} from "@/lib/infra-evidence/infra-evidence-terraform-filter-url";
import {
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
  const searchParams = useSearchParams();
  const urlSnapshotId = parseInfraEvidenceWorkbenchQueryValue(searchParams.get(INFRA_TERRAFORM_SNAPSHOT_ID_PARAM));
  const urlCloudResourceId = parseInfraEvidenceWorkbenchQueryValue(
    searchParams.get(INFRA_TERRAFORM_CLOUD_RESOURCE_ID_PARAM),
  );

  const [hub, setHub] = useState<CloudResourceEvidenceHubResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const auditScope = useMemo(() => parseInfraEvidenceWorkbenchAuditScopeFromSearch(searchParams), [searchParams]);
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
        const response = await fetchCloudResourceEvidenceHub(urlCloudResourceId, {
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
      ...mergeInfrastructureAskAuditScope(auditScope),
    });
  }, [auditScope, resolvedSnapshotId, urlCloudResourceId]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6" data-testid="infra-terraform-workbench">
      <LayerHeader pageKey="infrastructure-terraform" />
      <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        Review advisory Terraform mapping reconstructed from inventory evidence. This is not original Terraform and must
        not be applied without human review.
      </p>

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
          {auditScope != null ? (
            <div className="mt-2">
              <WorkbenchAuditProvenance
                auditScope={auditScope}
                controlNumber={hub?.auditLineageLink.controlNumber}
                controlTitle={hub?.auditLineageLink.controlTitle}
                testId="infra-terraform-audit-provenance"
              />
            </div>
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

      {hub != null ? (
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
          <p className={cn("mt-3", OPERATOR_TYPOGRAPHY.helper)}>{TERRAFORM_ADVISORY_EXPORT_DISCLAIMER}</p>
          <div className="mt-3 flex flex-wrap gap-2">
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
