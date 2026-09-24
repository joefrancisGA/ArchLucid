"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { CopyIdButton } from "@/components/CopyIdButton";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { SponsorExportSendHonestyStrip } from "@/components/exports/SponsorExportSendHonestyStrip";
import { InfraEvidenceSelectionAnnouncer } from "@/components/infra-evidence/InfraEvidenceSelectionAnnouncer";
import { InfraAuditLineageUnavailableBanner } from "@/components/infra-evidence/InfraAuditLineageUnavailableBanner";
import { WorkbenchAuditLineageStatus } from "@/components/infra-evidence/WorkbenchAuditLineageStatus";
import { WorkbenchHubScopeLinks } from "@/components/infra-evidence/WorkbenchHubScopeLinks";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { ShortcutHint } from "@/components/ShortcutHint";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton, PAGE_HELP_SHORT_TRIGGER_TEXT } from "@/components/usability/PageContextualHelpButton";
import { PageShortcutsDisclosure } from "@/components/usability/PageShortcutsDisclosure";
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
  formatAzureResourceTypeForDisplay,
  formatCloudResourceDisplayName,
} from "@/lib/infra-evidence/format-azure-resource-display";
import {
  buildTerraformWorkbenchHref,
  infraTerraformFilterHrefFromSearch,
  INFRA_TERRAFORM_CLOUD_RESOURCE_ID_PARAM,
  INFRA_TERRAFORM_SNAPSHOT_ID_PARAM,
} from "@/lib/infra-evidence/infra-evidence-terraform-filter-url";
import { TERRAFORM_WORKBENCH_PAGE_SHORTCUTS } from "@/lib/infra-evidence/infra-evidence-terraform-page-shortcuts";
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
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_ADVISORY_RECONSTRUCTED_TAG,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_APPLY_SAFETY_WARNING,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_APPLY_SAFETY_WARNING_ID,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HUB_LOAD_RETRY_ACTION,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_CLEAR_RESOURCE_SCOPE_ACTION,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_CLEAR_SNAPSHOT_SCOPE_ACTION,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_EXPORT_DISABLED_NO_SNAPSHOT,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_KEYBOARD_AFFORDANCE,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_NOT_MAPPED_BODY,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_NOT_MAPPED_TAG,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_NOT_MAPPED_TITLE,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SCOPE_LABEL,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SCOPE_NOT_SCOPED_LABEL,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SCOPE_SCOPED_LABEL,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SKIP_LINK_LABEL,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SNAPSHOT_DEEP_LINK_RECOVERY,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_ANNOUNCEMENT,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_BODY,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_DRIFT_ACTION,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_RESOURCES_ACTION,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_TITLE,
} from "@/lib/governance/governance-infrastructure-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { infrastructureDriftPathForProductLine, infrastructureTerraformPathForProductLine } from "@/lib/product-line/securenow-infrastructure-routes";
import { infrastructureResourcesPathForProductLine } from "@/lib/product-line/securenow-infrastructure-resources-route";
import {
  listRecentInfraEvidenceTerraformWorkbenchTargets,
  resolveContinueLastInfraEvidenceTerraformWorkbench,
  type ContinueLastInfraEvidenceTerraformWorkbenchTarget,
} from "@/lib/resolve-continue-last-infra-evidence-terraform-workbench";
import { cn } from "@/lib/utils";

import { TerraformBreadcrumb } from "./TerraformBreadcrumb";
import { TerraformClaimOrientationStrip } from "./TerraformClaimOrientationStrip";
import { TerraformWorkbenchBuildProvenanceStrip } from "./TerraformWorkbenchBuildProvenanceStrip";
import { TerraformWorkbenchContinueLastViewedRow } from "./TerraformWorkbenchContinueLastViewedRow";
import { TerraformWorkbenchRecentMappingsTable } from "./TerraformWorkbenchRecentMappingsTable";
import { TerraformWorkbenchScopePicker } from "./TerraformWorkbenchScopePicker";
import { useTerraformWorkbenchShortcuts } from "./use-terraform-workbench-shortcuts";

const cnCard =
  "rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950";

function formatSnapshotShortId(snapshotId: string): string {
  const trimmed = snapshotId.trim();

  if (trimmed.length === 0) {
    return "";
  }

  return trimmed.length > 8 ? `${trimmed.slice(0, 8)}…` : trimmed;
}

export function TerraformWorkbenchClient() {
  const buyerPolishedShell = useProductionEvalChrome();
  const { productLine } = useProductLine();
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopePickerRef = useRef<HTMLInputElement | null>(null);
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
  const isUnscoped = urlCloudResourceId.length === 0;

  const [hub, setHub] = useState<CloudResourceEvidenceHubResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [hubReloadNonce, setHubReloadNonce] = useState(0);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [terraformResourceIdOpen, setTerraformResourceIdOpen] = useState(false);
  const [continueLastTarget, setContinueLastTarget] = useState<ContinueLastInfraEvidenceTerraformWorkbenchTarget | null>(
    null,
  );
  const [recentMappingTargets, setRecentMappingTargets] = useState<
    readonly ContinueLastInfraEvidenceTerraformWorkbenchTarget[]
  >([]);

  const focusScopePicker = useCallback(() => {
    scopePickerRef.current?.focus();
    scopePickerRef.current?.select();
  }, []);

  useTerraformWorkbenchShortcuts(focusScopePicker, { enabled: isUnscoped });

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
      return GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_ANNOUNCEMENT;
    }

    if (resolvedSnapshotId.length === 0) {
      return "Terraform mapping scoped to resource — snapshot will resolve from the hub when available.";
    }

    return `Terraform mapping scoped to snapshot ${resolvedSnapshotId}.`;
  }, [resolvedSnapshotId, urlCloudResourceId]);

  const scopeStatusBadge = useMemo(() => {
    if (urlCloudResourceId.length === 0) {
      return (
        <StatusTag
          kind="needs-attention"
          label={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SCOPE_NOT_SCOPED_LABEL}
          data-testid="infra-terraform-scope-status"
        />
      );
    }

    const snapshotShort = formatSnapshotShortId(resolvedSnapshotId);

    return (
      <div className="flex flex-wrap items-center gap-2">
        <StatusTag
          kind="ready"
          label={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SCOPE_SCOPED_LABEL}
          data-testid="infra-terraform-scope-status"
        />
        {resolvedSnapshotId.length > 0 ? (
          <span
            className="inline-flex items-center gap-1 font-mono text-xs text-al-text-secondary"
            data-testid="infra-terraform-scope-snapshot-id"
          >
            {snapshotShort}
            <CopyIdButton value={resolvedSnapshotId} aria-label="Copy snapshot id" />
          </span>
        ) : null}
      </div>
    );
  }, [resolvedSnapshotId, urlCloudResourceId]);

  const resourceScopeSummary = useMemo(() => {
    if (hub == null) {
      return null;
    }

    const displayName = formatCloudResourceDisplayName({
      displayName: null,
      externalResourceId: hub.externalResourceId,
    });
    const resourceType = formatAzureResourceTypeForDisplay(hub.currentConfiguration?.resourceType ?? null);

    return { displayName, resourceType };
  }, [hub]);

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
    if (urlCloudResourceId.length > 0) {
      setContinueLastTarget(null);
      setRecentMappingTargets([]);

      return;
    }

    setContinueLastTarget(resolveContinueLastInfraEvidenceTerraformWorkbench(productLine));
    setRecentMappingTargets(listRecentInfraEvidenceTerraformWorkbenchTargets(productLine, 5));
  }, [productLine, urlCloudResourceId.length]);

  useEffect(() => {
    setCopyMessage(null);
    setExportError(null);
  }, [urlCloudResourceId, urlSnapshotId]);

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
  }, [hubReloadNonce, urlCloudResourceId, urlSnapshotId]);

  const retryHubLoad = useCallback(() => {
    setLoadError(null);
    setHubReloadNonce((value) => value + 1);
  }, []);

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

  const driftWorkbenchHref = useMemo(() => {
    if (urlCloudResourceId.length === 0) {
      return null;
    }

    return buildDriftWorkbenchHref({
      cloudResourceId: urlCloudResourceId,
      snapshotId: resolvedSnapshotId.length > 0 ? resolvedSnapshotId : null,
      assessmentId: auditScope?.assessmentId ?? null,
      auditEvidenceSnapshotId: auditScope?.auditEvidenceSnapshotId ?? null,
      controlId: auditScope?.controlId ?? null,
    });
  }, [auditScope, resolvedSnapshotId, urlCloudResourceId]);

  const findingsHubHref = useMemo(() => {
    if (urlCloudResourceId.length === 0) {
      return null;
    }

    return buildResourceHubWorkbenchHref({
      cloudResourceId: urlCloudResourceId,
      tab: "findings",
      ...workbenchHubScopePatch,
    });
  }, [urlCloudResourceId, workbenchHubScopePatch]);

  const advisorySnippet = useMemo(
    () => (hub != null ? buildAdvisoryTerraformResourceSnippet(hub) : null),
    [hub],
  );

  const hasTerraformMapping = useMemo(() => {
    const terraformAddress = hub?.terraformAddress?.trim() ?? "";

    return terraformAddress.length > 0;
  }, [hub]);

  const exportDisabledReason = useMemo(() => {
    if (exportBusy || resolvedSnapshotId.length > 0) {
      return null;
    }

    return GOVERNANCE_INFRASTRUCTURE_TERRAFORM_EXPORT_DISABLED_NO_SNAPSHOT;
  }, [exportBusy, resolvedSnapshotId.length]);

  const runAdvisoryExport = async () => {
    if (resolvedSnapshotId.length === 0) {
      return;
    }

    setExportBusy(true);
    setExportError(null);

    try {
      await downloadInfraEvidenceTerraformAdvisoryZip(resolvedSnapshotId);
    } catch (error: unknown) {
      setExportError(formatInfraEvidenceHubApiError(error));
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

    try {
      await navigator.clipboard.writeText(advisorySnippet);
      setCopyMessage("Copied advisory snippet.");
      window.setTimeout(() => {
        setCopyMessage(null);
      }, 4000);
    } catch {
      setCopyMessage("Clipboard copy failed — select the snippet manually.");
    }
  };

  const headerActions = (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {scopeStatusBadge}
        <PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />
      </div>
      {isUnscoped ? (
        <PageShortcutsDisclosure
          testId="infra-terraform-page-shortcuts"
          entries={TERRAFORM_WORKBENCH_PAGE_SHORTCUTS}
        />
      ) : null}
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        <ShortcutHint shortcut="F1" /> page help; <ShortcutHint shortcut="Ctrl+K" /> search;{" "}
        {isUnscoped ? (
          <>
            <ShortcutHint shortcut="Alt+1" /> scope picker.
            <span className="sr-only">{GOVERNANCE_INFRASTRUCTURE_TERRAFORM_KEYBOARD_AFFORDANCE}</span>
          </>
        ) : null}
      </p>
    </div>
  );

  return (
    <OperatorPageContainer
      variant="full"
      className="py-4"
      data-testid="infra-terraform-workbench"
    >
      <a
        href={`#${GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SKIP_LINK_LABEL}
      </a>

      <OperatorPageHeader
        navHref={terraformPath}
        title={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PAGE_TITLE}
        subtitle={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PAGE_LEAD}
        subtitleTestId="infra-terraform-page-lead"
        claimDiscipline={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_CLAIM_DISCIPLINE}
        claimDisciplineTestId="infra-terraform-claim-discipline"
        titleTestId="infra-terraform-page-title"
        metadata={<TerraformBreadcrumb />}
        actions={headerActions}
      />

      <main
        id={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PRIMARY_CONTENT_ID}
        className="flex w-full flex-col gap-4 scroll-mt-24"
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

        {urlCloudResourceId.length === 0 ? (
          <>
            {continueLastTarget != null ? (
              <TerraformWorkbenchContinueLastViewedRow target={continueLastTarget} />
            ) : null}
            <section
              aria-labelledby="infra-terraform-unscoped-heading"
              className="rounded-md border border-dashed border-neutral-200 px-3 py-3 dark:border-neutral-700"
              data-testid="infra-terraform-unscoped-panel"
            >
              <h2
                id="infra-terraform-unscoped-heading"
                className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle, "text-al-text-primary")}
              >
                {GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_TITLE}
              </h2>
              <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_BODY}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild variant="primary" size="sm">
                  <Link href={resourcesPath}>{GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_RESOURCES_ACTION}</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={driftPath}>{GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_DRIFT_ACTION}</Link>
                </Button>
              </div>
            </section>
            <TerraformWorkbenchScopePicker inputRef={scopePickerRef} />
            <TerraformWorkbenchRecentMappingsTable targets={recentMappingTargets} />
            {buyerPolishedShell ? <TerraformClaimOrientationStrip /> : null}
            <TerraformWorkbenchBuildProvenanceStrip />
          </>
        ) : null}

        {deepLinkedSnapshotMissing ? (
          <div
            role="alert"
            className="rounded-md border border-dashed border-neutral-200 px-3 py-3 dark:border-neutral-700"
            data-testid="infra-terraform-snapshot-deep-link-missing"
          >
            <div className="flex flex-wrap items-center gap-2">
              <StatusTag kind="needs-attention" label="The linked snapshot is not available for this scoped resource." />
            </div>
            <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SNAPSHOT_DEEP_LINK_RECOVERY}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" data-testid="infra-terraform-clear-snapshot-scope">
                <Link href={clearSnapshotScopeHref}>{GOVERNANCE_INFRASTRUCTURE_TERRAFORM_CLEAR_SNAPSHOT_SCOPE_ACTION}</Link>
              </Button>
              {driftWorkbenchHref != null ? (
                <Button asChild variant="outline" size="sm" data-testid="infra-terraform-open-drift-recovery">
                  <Link href={driftWorkbenchHref}>{GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_DRIFT_ACTION}</Link>
                </Button>
              ) : null}
            </div>
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-testid="infra-terraform-retry-hub-load"
                  onClick={retryHubLoad}
                >
                  {GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HUB_LOAD_RETRY_ACTION}
                </Button>
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
            <div className="grid gap-2">
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                {GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SCOPE_LABEL}
                {resourceScopeSummary != null ? (
                  <>
                    {": "}
                    <span className="font-medium text-al-text-primary">{resourceScopeSummary.displayName}</span>
                    <span className="text-al-text-secondary"> ({resourceScopeSummary.resourceType})</span>
                  </>
                ) : null}
                .
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-al-text-secondary">{urlCloudResourceId}</span>
                <CopyIdButton value={urlCloudResourceId} aria-label="Copy cloud resource id" />
              </div>
            </div>
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
          <EnterpriseCompactEmptyState
            title={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_NOT_MAPPED_TITLE}
            description={
              <div className="flex flex-wrap items-center gap-2">
                <StatusTag kind="needs-attention" label={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_NOT_MAPPED_TAG} />
                <span>{GOVERNANCE_INFRASTRUCTURE_TERRAFORM_NOT_MAPPED_BODY}</span>
              </div>
            }
            testId="infra-terraform-empty-state"
            actions={
              driftWorkbenchHref != null
                ? [
                    {
                      label: GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_DRIFT_ACTION,
                      href: driftWorkbenchHref,
                      variant: "primary",
                    },
                  ]
                : undefined
            }
          />
        ) : null}

        {hub != null && hasTerraformMapping ? (
          <section className={cnCard} aria-label={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PAGE_TITLE}>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>{GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PAGE_TITLE}</h2>
              <StatusTag
                kind="needs-attention"
                label={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_ADVISORY_RECONSTRUCTED_TAG}
                data-testid="infra-terraform-advisory-reconstructed-tag"
              />
            </div>
            <dl className="mt-3 grid gap-2 text-sm">
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
                  tabIndex={0}
                  role="region"
                  aria-label="Advisory Terraform snippet preview"
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
            <p
              id={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_APPLY_SAFETY_WARNING_ID}
              className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              role="note"
            >
              {GOVERNANCE_INFRASTRUCTURE_TERRAFORM_APPLY_SAFETY_WARNING}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                data-testid="infra-terraform-download-advisory-zip"
                disabled={exportBusy || exportDisabledReason != null}
                aria-describedby={
                  exportDisabledReason != null
                    ? "infra-terraform-export-disabled-reason"
                    : exportError != null
                      ? "infra-terraform-export-error"
                      : GOVERNANCE_INFRASTRUCTURE_TERRAFORM_APPLY_SAFETY_WARNING_ID
                }
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
              {advisorySnippet != null ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-testid="infra-terraform-copy-snippet"
                  aria-describedby={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_APPLY_SAFETY_WARNING_ID}
                  onClick={() => void copyAdvisorySnippet()}
                >
                  Copy advisory snippet
                </Button>
              ) : null}
            </div>
            {exportError != null ? (
              <OperatorMutationInlineError
                className="mt-3"
                message={exportError}
                testId="infra-terraform-export-error"
              />
            ) : null}
            {exportDisabledReason != null ? (
              <p
                id="infra-terraform-export-disabled-reason"
                className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              >
                {exportDisabledReason}
              </p>
            ) : null}
            <nav
              aria-label="Terraform mapping related actions"
              className="mt-3 flex flex-wrap gap-x-4 gap-y-1"
              data-testid="infra-terraform-related-action-links"
            >
              {terraformAskHref != null ? (
                <Link
                  href={terraformAskHref}
                  className={cn("text-sm text-al-link hover:underline", OPERATOR_LINK.inline)}
                  data-testid="infra-terraform-open-ask"
                >
                  Ask about this mapping
                </Link>
              ) : null}
              {findingsHubHref != null ? (
                <Link
                  href={findingsHubHref}
                  className={cn("text-sm text-al-link hover:underline", OPERATOR_LINK.inline)}
                  data-testid="infra-terraform-open-findings-hub"
                >
                  View findings in hub
                </Link>
              ) : null}
              {driftWorkbenchHref != null ? (
                <Link
                  href={driftWorkbenchHref}
                  className={cn("text-sm text-al-link hover:underline", OPERATOR_LINK.inline)}
                  data-testid="infra-terraform-open-drift-workbench"
                >
                  Open drift workbench
                </Link>
              ) : null}
            </nav>
            <SponsorExportSendHonestyStrip className="mt-3 max-w-xl" testIdPrefix="infra-terraform-advisory-zip" />
          </section>
        ) : null}

        {urlCloudResourceId.length > 0 ? (
          <>
            {buyerPolishedShell ? <TerraformClaimOrientationStrip /> : null}
            <TerraformWorkbenchBuildProvenanceStrip />
          </>
        ) : null}
      </main>
    </OperatorPageContainer>
  );
}
