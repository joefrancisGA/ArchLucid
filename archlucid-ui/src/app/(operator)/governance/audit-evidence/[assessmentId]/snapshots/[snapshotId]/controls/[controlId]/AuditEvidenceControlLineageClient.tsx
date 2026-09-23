"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { ShortcutHint } from "@/components/ShortcutHint";
import {
  PAGE_HELP_SHORT_TRIGGER_TEXT,
  PageContextualHelpButton,
} from "@/components/usability/PageContextualHelpButton";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { useAuditEvidenceLineageQuery } from "@/hooks/use-audit-evidence-lineage-query";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { deriveAuditLineageCheckboxPresentation } from "@/lib/audit-evidence-lineage-presentation";
import { auditEvidenceLineageLookupPathFromPathname } from "@/lib/audit-evidence-lineage-route";
import { auditEvidenceLineageBlockedReason } from "@/lib/governance/audit-evidence-lineage-blocked-reason";
import { auditEvidencePackageBlockedReason } from "@/lib/governance/audit-evidence-package-blocked-reason";
import { downloadAuditEvidencePackageZip } from "@/lib/governance/audit-evidence-package-api";
import {
  AUDIT_EVIDENCE_CONTROL_LINEAGE_BACK_TO_LOOKUP_ACTION,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_CLAIM_DISCIPLINE,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_COLLAPSE_ACTION,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_COPY_LINK_ACTION,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_ERROR_BODY,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_ERROR_TITLE,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_EXPAND_ACTION,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_KEYBOARD_AFFORDANCE,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_LOADING_LABEL,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_PACKAGE_DOWNLOAD_ACTION,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_PACKAGE_DOWNLOAD_BUSY,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_PAGE_LEAD,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_PRIMARY_CONTENT_ID,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_RETRY_ACTION,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_SKIP_LINK_LABEL,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_SNAPSHOT_SCOPE_NOTE,
  AUDIT_EVIDENCE_PACKAGE_DOWNLOAD_ERROR_TITLE,
  formatAuditEvidenceControlLineagePageTitle,
} from "@/lib/audit-evidence-page-copy";

import {
  auditEvidenceLineageChainHrefFromSearch,
  parseAuditEvidenceLineageChainOpenFromSearch,
} from "@/lib/governance/audit-evidence-lineage-chain-url";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { formatGovernanceInfrastructureInlineActionError } from "@/lib/governance/governance-infrastructure-copy";

import { cn } from "@/lib/utils";

import { AuditEvidenceControlLineageBreadcrumb } from "./AuditEvidenceControlLineageBreadcrumb";
import { AuditEvidenceControlLineageClaimOrientationStrip } from "./AuditEvidenceControlLineageClaimOrientationStrip";
import { AuditEvidenceLineageRouteIdentifiersDisclosure } from "./AuditEvidenceLineageRouteIdentifiersDisclosure";
import { AuditEvidenceLineageSpine } from "./AuditEvidenceLineageSpine";

type AuditEvidenceControlLineageClientProps = {
  readonly assessmentId: string;
  readonly snapshotId: string;
  readonly controlId: string;
};

export function AuditEvidenceControlLineageClient(props: AuditEvidenceControlLineageClientProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const buyerPolishedShell = useProductionEvalChrome();
  const lookupPath = useMemo(() => auditEvidenceLineageLookupPathFromPathname(pathname), [pathname]);
  const lineageChainOpenParam = searchParams.get("lineageChainOpen");
  const lineageQuery = useAuditEvidenceLineageQuery(props.assessmentId, props.snapshotId, props.controlId);
  const [packageDownloadBusy, setPackageDownloadBusy] = useState(false);
  const [packageDownloadError, setPackageDownloadError] = useState<string | null>(null);
  const [lineageLinkCopied, setLineageLinkCopied] = useState(false);
  const [chainExpanded, setChainExpandedState] = useState(() =>
    parseAuditEvidenceLineageChainOpenFromSearch(lineageChainOpenParam),
  );
  const lineageBlockedReason = useMemo(
    () => (lineageQuery.isError ? auditEvidenceLineageBlockedReason(toApiLoadFailure(lineageQuery.error)) : null),
    [lineageQuery.error, lineageQuery.isError],
  );

  const syncChainExpandedToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        auditEvidenceLineageChainHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setChainExpanded = useCallback(
    (value: boolean | ((current: boolean) => boolean)) => {
      setChainExpandedState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncChainExpandedToUrl(next);

        return next;
      });
    },
    [syncChainExpandedToUrl],
  );

  useEffect(() => {
    setChainExpandedState(parseAuditEvidenceLineageChainOpenFromSearch(lineageChainOpenParam));
  }, [lineageChainOpenParam]);

  const lineage = lineageQuery.data;
  const checkboxPresentation = lineage ? deriveAuditLineageCheckboxPresentation(lineage) : null;
  const chainToggleLabel = chainExpanded
    ? AUDIT_EVIDENCE_CONTROL_LINEAGE_COLLAPSE_ACTION
    : AUDIT_EVIDENCE_CONTROL_LINEAGE_EXPAND_ACTION;
  const pageTitle = lineage
    ? formatAuditEvidenceControlLineagePageTitle(lineage.controlNumber, lineage.controlTitle)
    : formatAuditEvidenceControlLineagePageTitle(undefined, undefined);

  const onDownloadEvidencePackage = useCallback(async () => {
    setPackageDownloadBusy(true);
    setPackageDownloadError(null);

    try {
      await downloadAuditEvidencePackageZip(props.assessmentId, props.snapshotId);
    } catch (error: unknown) {
      const failure = toApiLoadFailure(error);
      const blocked = auditEvidencePackageBlockedReason(failure);

      setPackageDownloadError(
        formatGovernanceInfrastructureInlineActionError(
          AUDIT_EVIDENCE_PACKAGE_DOWNLOAD_ERROR_TITLE,
          blocked ?? (error instanceof Error ? error.message : String(error)),
        ),
      );
    } finally {
      setPackageDownloadBusy(false);
    }
  }, [props.assessmentId, props.snapshotId]);

  const onCopyLineageLink = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setLineageLinkCopied(true);
      window.setTimeout(() => {
        setLineageLinkCopied(false);
      }, 2_000);
    } catch {
      /* clipboard unavailable */
    }
  }, []);

  return (
    <OperatorPageContainer
      variant="workflow"
      className={OPERATOR_LAYOUT.sectionStack}
      data-testid="audit-evidence-control-lineage-page"
    >
      <AuditEvidenceControlLineageBreadcrumb />

      <a
        href={`#${AUDIT_EVIDENCE_CONTROL_LINEAGE_PRIMARY_CONTENT_ID}`}
        className={cn(HELP_PAGE_LAYOUT.technicalReferenceSkipLink, OPERATOR_LINK.inline)}
      >
        {AUDIT_EVIDENCE_CONTROL_LINEAGE_SKIP_LINK_LABEL}
      </a>

      <OperatorPageHeader
        navHref={lookupPath}
        headingLevel="h1"
        title={pageTitle}
        subtitle={AUDIT_EVIDENCE_CONTROL_LINEAGE_PAGE_LEAD}
        claimDiscipline={AUDIT_EVIDENCE_CONTROL_LINEAGE_CLAIM_DISCIPLINE}
        claimDisciplineTestId="audit-evidence-control-lineage-claim-discipline"
        actions={
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={packageDownloadBusy}
                data-testid="audit-evidence-package-download"
                aria-describedby={packageDownloadError != null ? "audit-evidence-package-download-error" : undefined}
                onClick={() => {
                  void onDownloadEvidencePackage();
                }}
              >
                {packageDownloadBusy
                  ? AUDIT_EVIDENCE_CONTROL_LINEAGE_PACKAGE_DOWNLOAD_BUSY
                  : AUDIT_EVIDENCE_CONTROL_LINEAGE_PACKAGE_DOWNLOAD_ACTION}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="audit-evidence-lineage-copy-link"
                onClick={() => {
                  void onCopyLineageLink();
                }}
              >
                {lineageLinkCopied ? "Copied" : AUDIT_EVIDENCE_CONTROL_LINEAGE_COPY_LINK_ACTION}
              </Button>
              <PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />
            </div>
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}
              data-testid="audit-evidence-control-lineage-keyboard-affordance"
            >
              <ShortcutHint shortcut="F1" /> page help; <ShortcutHint shortcut="Ctrl+K" /> search.
              <span className="sr-only">{AUDIT_EVIDENCE_CONTROL_LINEAGE_KEYBOARD_AFFORDANCE}</span>
            </p>
          </div>
        }
      />

      {packageDownloadError != null ? (
        <OperatorMutationInlineError
          message={packageDownloadError}
          testId="audit-evidence-package-download-error"
        />
      ) : null}

      <p
        className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="audit-evidence-control-lineage-snapshot-scope-note"
      >
        {AUDIT_EVIDENCE_CONTROL_LINEAGE_SNAPSHOT_SCOPE_NOTE}
      </p>

      <div
        id={AUDIT_EVIDENCE_CONTROL_LINEAGE_PRIMARY_CONTENT_ID}
        className={cn("min-w-0 space-y-4 scroll-mt-24")}
        data-testid="audit-evidence-control-lineage-primary-content"
      >
        <AuditEvidenceLineageRouteIdentifiersDisclosure
          assessmentId={props.assessmentId}
          snapshotId={props.snapshotId}
          controlId={props.controlId}
        />

        {lineageQuery.isPending ? (
          <OperatorLoadingNotice data-testid="audit-evidence-lineage-loading">
            {AUDIT_EVIDENCE_CONTROL_LINEAGE_LOADING_LABEL}
          </OperatorLoadingNotice>
        ) : null}

        {lineageQuery.isError ? (
          <div data-testid="audit-evidence-lineage-error">
            <EnterpriseCompactEmptyState
              role="alert"
              title={AUDIT_EVIDENCE_CONTROL_LINEAGE_ERROR_TITLE}
              description={lineageBlockedReason ?? AUDIT_EVIDENCE_CONTROL_LINEAGE_ERROR_BODY}
              prominentBoundary
              testId="audit-evidence-lineage-error-panel"
              footer={
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    data-testid="audit-evidence-lineage-retry"
                    onClick={() => void lineageQuery.refetch()}
                  >
                    {AUDIT_EVIDENCE_CONTROL_LINEAGE_RETRY_ACTION}
                  </Button>
                  <Button type="button" size="sm" variant="outline" asChild>
                    <Link
                      href={lookupPath}
                      data-testid="audit-evidence-lineage-back-to-lookup"
                    >
                      {AUDIT_EVIDENCE_CONTROL_LINEAGE_BACK_TO_LOOKUP_ACTION}
                    </Link>
                  </Button>
                </div>
              }
            />
          </div>
        ) : null}

        {lineage && checkboxPresentation ? (
          <section className="space-y-3" aria-label="Control support status">
            <div className="flex flex-wrap items-center gap-3">
              <StatusTag
                kind={checkboxPresentation.kind}
                label={checkboxPresentation.label}
                data-testid="audit-evidence-lineage-status-tag"
              />
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {checkboxPresentation.detail}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="audit-evidence-positive-checkbox"
                aria-expanded={chainExpanded}
                aria-label={chainToggleLabel}
                onClick={() => setChainExpanded((value) => !value)}
              >
                {chainToggleLabel}
              </Button>
            </div>

            <AuditEvidenceLineageSpine
              lineage={lineage}
              expanded={chainExpanded || !lineage.readyForPositiveCheckbox}
              buyerPolishedShell={buyerPolishedShell}
              lineageContext={{
                assessmentId: props.assessmentId,
                auditEvidenceSnapshotId: props.snapshotId,
                controlId: props.controlId,
              }}
            />
          </section>
        ) : null}

        <AuditEvidenceControlLineageClaimOrientationStrip />
      </div>
    </OperatorPageContainer>
  );
}
