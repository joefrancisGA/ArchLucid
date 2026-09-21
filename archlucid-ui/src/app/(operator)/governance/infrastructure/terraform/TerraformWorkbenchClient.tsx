"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { LayerHeader } from "@/components/LayerHeader";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { SponsorExportSendHonestyStrip } from "@/components/exports/SponsorExportSendHonestyStrip";
import { InfraEvidenceSelectionAnnouncer } from "@/components/infra-evidence/InfraEvidenceSelectionAnnouncer";
import { InfraAuditLineageUnavailableBanner } from "@/components/infra-evidence/InfraAuditLineageUnavailableBanner";
import { WorkbenchAuditLineageStatus } from "@/components/infra-evidence/WorkbenchAuditLineageStatus";
import { WorkbenchHubScopeLinks } from "@/components/infra-evidence/WorkbenchHubScopeLinks";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { ShortcutHint } from "@/components/ShortcutHint";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton, PAGE_HELP_SHORT_TRIGGER_TEXT } from "@/components/usability/PageContextualHelpButton";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { buildAdvisoryTerraformResourceSnippet } from "@/lib/infra-evidence/build-advisory-terraform-resource-snippet";
import { downloadInfraEvidenceTerraformAdvisoryZip } from "@/lib/infra-evidence/infra-evidence-drift-api";
import {
  formatInfraEvidenceHubApiError,
} from "@/lib/infra-evidence/infra-evidence-hub-api";
import { buildInfrastructureAskHref, resourceHubFilterHrefFromSearch } from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import type { CloudResourceEvidenceHubResponse } from "@/lib/infra-evidence/infra-evidence-hub-types";
import {
  buildTerraformWorkbenchHref,
  infraTerraformFilterHrefFromSearch,
  INFRA_TERRAFORM_CLOUD_RESOURCE_ID_PARAM,
  INFRA_TERRAFORM_SNAPSHOT_ID_PARAM,
} from "@/lib/infra-evidence/infra-evidence-terraform-filter-url";
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
import {
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_CLEAR_RESOURCE_SCOPE_ACTION,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_CLEAR_SNAPSHOT_SCOPE_ACTION,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_KEYBOARD_AFFORDANCE,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SCOPE_LABEL,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SKIP_LINK_LABEL,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SNAPSHOT_DEEP_LINK_RECOVERY,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_ANNOUNCEMENT,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_BODY,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_DRIFT_ACTION,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_RESOURCES_ACTION,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_TITLE,
} from "@/lib/governance/governance-infrastructure-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { infrastructureDriftPathForProductLine, infrastructureTerraformPathForProductLine } from "@/lib/product-line/securenow-infrastructure-routes";
import { infrastructureResourcesPathForProductLine } from "@/lib/product-line/securenow-infrastructure-resources-route";
import {
  resolveContinueLastInfraEvidenceTerraformWorkbench,
  type ContinueLastInfraEvidenceTerraformWorkbenchTarget,
} from "@/lib/resolve-continue-last-infra-evidence-terraform-workbench";
import { cn } from "@/lib/utils";

import { TerraformBreadcrumb } from "./TerraformBreadcrumb";
import { TerraformClaimOrientationStrip } from "./TerraformClaimOrientationStrip";
import { TerraformWorkbenchBuildProvenanceStrip } from "./TerraformWorkbenchBuildProvenanceStrip";
import { TerraformWorkbenchContinueLastViewedRow } from "./TerraformWorkbenchContinueLastViewedRow";

const cnCard =
  "rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950";

export function TerraformWorkbenchClient() {
  const buyerPolishedShell = useProductionEvalChrome();
  const { productLine } = useProductLine();
  const router = useRouter();
  const searchParams = useSearchParams();
  const terraformPath = useMemo(
    () => infrastructureTerraformPathForProductLine(productLine),
    [productLine],
  );
  const resourcesPath = useMemo(
    () => infrastructureResourcesPathForProductLine(productLine),
    [productLine],
  );
  const driftPath = useMemo(() => infrastructureDriftPathForProductLine(productLine), [productLine]);

  const urlSnapshotId = parseInfraEvidenceWorkbenchQueryValue(searchParams.get(INFRA_TERRAFORM_SNAPSHOT_ID_PARAM));
  const urlCloudResourceId = parseInfraEvidenceWorkbenchQueryValue(
    searchParams.get(INFRA_TERRAFORM_CLOUD_RESOURCE_ID_PARAM),
  );

  const [hub, setHub] = useState<CloudResourceEvidenceHubResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [exportBusy, setExportBusy] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [terraformResourceIdOpen, setTerraformResourceIdOpen] = useState(false);
  const [continueLastTarget, setContinueLastTarget] = useState<ContinueLastInfraEvidenceTerraformWorkbenchTarget | null>(
    null,
  );

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
    if (urlCloudResourceId.length === 0) {
      return buyerPolishedShell ? GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_ANNOUNCEMENT : null;
    }

    if (resolvedSnapshotId.length === 0) {
      return "Terraform mapping scoped to resource — snapshot will resolve from the hub when available.";
    }

    return `Terraform mapping scoped to snapshot ${resolvedSnapshotId}.`;
  }, [buyerPolishedShell, resolvedSnapshotId, urlCloudResourceId]);

  const clearResourceScopeHref = useMemo(
    () =>
      infraTerraformFilterHrefFromSearch(
        searchParams.toString(),
        { cloudResourceId: "", snapshotId: "" },
        terraformPath,
      ),
    [searchParams, terraformPath],
  );

  const clearSnapshotScopeHref = useMemo(
    () =>
      infraTerraformFilterHrefFromSearch(searchParams.toString(), { snapshotId: "" }, terraformPath),
    [searchParams, terraformPath],
  );

  const clearStaleAuditScopeHref = useMemo(
    () =>
      infraTerraformFilterHrefFromSearch(searchParams.toString(), {
        assessmentId: "",
        auditEvidenceSnapshotId: "",
        controlId: "",
      }, terraformPath),
    [searchParams, terraformPath],
  );

  useEffect(() => {
    if (!buyerPolishedShell || urlCloudResourceId.length > 0) {
      setContinueLastTarget(null);
      return;
    }

    setContinueLastTarget(resolveContinueLastInfraEvidenceTerraformWorkbench(productLine));
  }, [buyerPolishedShell, productLine, urlCloudResourceId.length]);

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
    <OperatorPageContainer
      variant="full"
      className="py-4"
      data-testid="infra-terraform-workbench"
    >
      {buyerPolishedShell ? (
        <a
          href={`#${GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PRIMARY_CONTENT_ID}`}
          className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
        >
          {GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SKIP_LINK_LABEL}
        </a>
      ) : null}

      <OperatorPageHeader
        navHref={terraformPath}
        title={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PAGE_TITLE}
        subtitle={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PAGE_LEAD}
        subtitleTestId="infra-terraform-page-lead"
        claimDiscipline={buyerPolishedShell ? GOVERNANCE_INFRASTRUCTURE_TERRAFORM_CLAIM_DISCIPLINE : undefined}
        claimDisciplineTestId="infra-terraform-claim-discipline"
        titleTestId="infra-terraform-page-title"
        breadcrumb={buyerPolishedShell ? <TerraformBreadcrumb /> : undefined}
        actions={
          <div className="flex flex-col items-end gap-1">
            <PageContextualHelpButton triggerText={buyerPolishedShell ? PAGE_HELP_SHORT_TRIGGER_TEXT : undefined} />
            {buyerPolishedShell ? (
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                <ShortcutHint shortcut="F1" /> page help; <ShortcutHint shortcut="Ctrl+K" /> search.
                <span className="sr-only">{GOVERNANCE_INFRASTRUCTURE_TERRAFORM_KEYBOARD_AFFORDANCE}</span>
              </p>
            ) : null}
          </div>
        }
      />

      {!buyerPolishedShell ? <LayerHeader pageKey="infrastructure-terraform" /> : null}

      <main
        id={buyerPolishedShell ? GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PRIMARY_CONTENT_ID : undefined}
        className={cn("flex w-full flex-col gap-4", buyerPolishedShell ? "scroll-mt-24" : undefined)}
        data-testid="infra-terraform-primary-content"
      >
        <InfraEvidenceSelectionAnnouncer message={selectionAnnouncement} testId="infra-terraform-selection-announcer" />

        {hasStaleAuditUrlParams && urlCloudResourceId.length === 0 ? (
          <InfraAuditLineageUnavailableBanner
            degradedReason="Audit scope in the URL could not be resolved."
            testId="infra-terraform-stale-audit-scope"
            clearAuditScopeHref={clearStaleAuditScopeHref}
          />
        ) : null}

        {urlCloudResourceId.length === 0 && buyerPolishedShell ? (
          <>
            {continueLastTarget != null ? (
              <TerraformWorkbenchContinueLastViewedRow target={continueLastTarget} />
            ) : null}
            <EnterpriseCompactEmptyState
              title={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_TITLE}
              description={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_BODY}
              testId="infra-terraform-unscoped-panel"
              actions={[
                {
                  label: GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_RESOURCES_ACTION,
                  href: resourcesPath,
                  variant: "primary",
                },
                {
                  label: GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_DRIFT_ACTION,
                  href: driftPath,
                  variant: "outline",
                },
              ]}
            />
            {buyerPolishedShell ? <TerraformClaimOrientationStrip /> : null}
            <TerraformWorkbenchBuildProvenanceStrip />
          </>
        ) : null}

        {urlCloudResourceId.length === 0 && !buyerPolishedShell ? (
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            Open this workbench from a scoped resource hub or explorer row to review Terraform mapping.
          </p>
        ) : null}

        {deepLinkedSnapshotMissing ? (
          <StatusTag
            kind="needs-attention"
            label="The linked snapshot is not available for this scoped resource."
            data-testid="infra-terraform-snapshot-deep-link-missing"
          />
        ) : null}

        {deepLinkedSnapshotMissing ? (
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn("m-0 flex-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SNAPSHOT_DEEP_LINK_RECOVERY}
            </p>
            <Button asChild variant="outline" size="sm" data-testid="infra-terraform-clear-snapshot-scope">
              <Link href={clearSnapshotScopeHref}>{GOVERNANCE_INFRASTRUCTURE_TERRAFORM_CLEAR_SNAPSHOT_SCOPE_ACTION}</Link>
            </Button>
            <Button asChild variant="outline" size="sm" data-testid="infra-terraform-open-drift-recovery">
              <Link href={buildDriftWorkbenchHref({ snapshotId: urlSnapshotId, cloudResourceId: urlCloudResourceId })}>
                {GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_DRIFT_ACTION}
              </Link>
            </Button>
          </div>
        ) : null}

        {loadError != null ? (
          <EnterpriseCompactEmptyState
            role="alert"
            title="Terraform mapping unavailable"
            description={loadError}
            testId="infra-terraform-load-error-panel"
            footer={
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm" data-testid="infra-terraform-clear-resource-scope">
                  <Link href={clearResourceScopeHref}>{GOVERNANCE_INFRASTRUCTURE_TERRAFORM_CLEAR_RESOURCE_SCOPE_ACTION}</Link>
                </Button>
                <Button asChild variant="outline" size="sm" data-testid="infra-terraform-open-resources-recovery">
                  <Link href={resourcesPath}>{GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_RESOURCES_ACTION}</Link>
                </Button>
              </div>
            }
          />
        ) : null}

        {urlCloudResourceId.length > 0 && loadError == null ? (
          <section
            className={cnCard}
            data-testid="infra-terraform-resource-scope-banner"
            aria-label="Terraform workbench resource scope"
          >
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              {buyerPolishedShell ? (
                GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SCOPE_LABEL
              ) : (
                <>
                  Scoped to resource <span className="font-mono text-xs">{urlCloudResourceId}</span>.
                </>
              )}
              {buyerPolishedShell ? "." : null}
            </p>
            {buyerPolishedShell ? (
              <CollapsibleSection
                title="Resource id"
                sectionTestId="infra-terraform-resource-id-disclosure"
                summaryLine="Cloud resource UUID from the scoped link"
                open={terraformResourceIdOpen}
                onToggle={setTerraformResourceIdOpen}
              >
                <p className={cn("m-0 font-mono text-xs break-all text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {urlCloudResourceId}
                </p>
              </CollapsibleSection>
            ) : null}
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
            Loading Terraform mapping…
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
          <section className={cnCard} aria-label={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PAGE_TITLE}>
            <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>{GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PAGE_TITLE}</h2>
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
            <SponsorExportSendHonestyStrip className="mt-3 max-w-xl" testIdPrefix="infra-terraform-advisory-zip" />
          </section>
        ) : null}

        {buyerPolishedShell && urlCloudResourceId.length > 0 ? (
          <>
            <TerraformClaimOrientationStrip />
            <TerraformWorkbenchBuildProvenanceStrip />
          </>
        ) : null}
      </main>
    </OperatorPageContainer>
  );
}
