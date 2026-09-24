"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CopyIdButton } from "@/components/CopyIdButton";
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

import {
  deriveAuditLineageCheckboxPresentation,
  formatAuditLineageEvaluationContext,
} from "@/lib/audit-evidence-lineage-presentation";
import { auditEvidenceLineageLookupPathFromPathname } from "@/lib/audit-evidence-lineage-route";
import { auditEvidenceLineageBlockedReason } from "@/lib/governance/audit-evidence-lineage-blocked-reason";
import { auditEvidencePackageBlockedReason } from "@/lib/governance/audit-evidence-package-blocked-reason";
import { downloadAuditEvidencePackageZip } from "@/lib/governance/audit-evidence-package-api";
import {
  AUDIT_EVIDENCE_CONTROL_LINEAGE_BACK_TO_LOOKUP_ACTION,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_CLAIM_DISCIPLINE,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_CHAIN_TOGGLE_SHORTCUT,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_COLLAPSE_ACTION,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_COPY_LINK_ACTION,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_COPY_LINK_FAILED_MESSAGE,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_COPY_LINK_SHORTCUT,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_ERROR_BODY,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_ERROR_TITLE,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_EXPAND_ACTION,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_KEYBOARD_AFFORDANCE,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_KEYBOARD_AFFORDANCE_ERROR,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_LOADING_LABEL,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_PACKAGE_DOWNLOAD_ACTION,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_PACKAGE_DOWNLOAD_BUSY,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_PACKAGE_DOWNLOAD_SHORTCUT,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_PACKAGE_DOWNLOAD_SUCCESS_MESSAGE,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_PAGE_LEAD,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_PRIMARY_CONTENT_ID,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_RETRY_ACTION,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_SKIP_LINK_LABEL,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_SNAPSHOT_SCOPE_NOTE,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_SNAPSHOT_SCOPE_NOTE_ID,
  AUDIT_EVIDENCE_PACKAGE_DOWNLOAD_ERROR_TITLE,
  formatAuditEvidenceControlLineagePageTitle,
} from "@/lib/audit-evidence-page-copy";

import {
  auditEvidenceLineageChainHrefFromSearch,
  resolveAuditEvidenceLineageChainExpanded,
} from "@/lib/governance/audit-evidence-lineage-chain-url";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { formatGovernanceInfrastructureInlineActionError } from "@/lib/governance/governance-infrastructure-copy";

import { formatShortId } from "@/lib/format-short-id";
import { cn } from "@/lib/utils";

import { AuditEvidenceControlLineageBreadcrumb } from "./AuditEvidenceControlLineageBreadcrumb";
import { AuditEvidenceControlLineageClaimOrientationStrip } from "./AuditEvidenceControlLineageClaimOrientationStrip";
import { AuditEvidenceLineageRouteIdentifiersDisclosure } from "./AuditEvidenceLineageRouteIdentifiersDisclosure";
import { AuditEvidenceLineageSpine } from "./AuditEvidenceLineageSpine";
import { useAuditEvidenceControlLineageShortcuts } from "./use-audit-evidence-control-lineage-shortcuts";

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
  const [packageDownloadAnnouncement, setPackageDownloadAnnouncement] = useState<string | null>(null);
  const [lineageLinkCopied, setLineageLinkCopied] = useState(false);
  const [lineageLinkCopyFeedback, setLineageLinkCopyFeedback] = useState<string | null>(null);
  const [chainExpanded, setChainExpandedState] = useState(() =>
    resolveAuditEvidenceLineageChainExpanded(lineageChainOpenParam, buyerPolishedShell),
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
    setChainExpandedState(resolveAuditEvidenceLineageChainExpanded(lineageChainOpenParam, buyerPolishedShell));
  }, [buyerPolishedShell, lineageChainOpenParam]);

  const lineage = lineageQuery.data;
  const checkboxPresentation = lineage ? deriveAuditLineageCheckboxPresentation(lineage) : null;
  const chainRegionId = "audit-evidence-lineage-chain-region";
  const keyboardAffordance =
    lineageQuery.isError
      ? AUDIT_EVIDENCE_CONTROL_LINEAGE_KEYBOARD_AFFORDANCE_ERROR
      : AUDIT_EVIDENCE_CONTROL_LINEAGE_KEYBOARD_AFFORDANCE;
  const chainToggleLabel = chainExpanded
    ? AUDIT_EVIDENCE_CONTROL_LINEAGE_COLLAPSE_ACTION
    : AUDIT_EVIDENCE_CONTROL_LINEAGE_EXPAND_ACTION;
  const pageTitle = lineage
    ? formatAuditEvidenceControlLineagePageTitle(lineage.controlNumber, lineage.controlTitle)
    : formatAuditEvidenceControlLineagePageTitle(undefined, undefined);

  const onDownloadEvidencePackage = useCallback(async () => {
    setPackageDownloadBusy(true);
    setPackageDownloadError(null);
    setPackageDownloadAnnouncement(null);

    try {
      await downloadAuditEvidencePackageZip(props.assessmentId, props.snapshotId);
      setPackageDownloadAnnouncement(AUDIT_EVIDENCE_CONTROL_LINEAGE_PACKAGE_DOWNLOAD_SUCCESS_MESSAGE);
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

    setLineageLinkCopyFeedback(null);

    try {
      await navigator.clipboard.writeText(window.location.href);
      setLineageLinkCopied(true);
      setLineageLinkCopyFeedback("Lineage link copied.");
      window.setTimeout(() => {
        setLineageLinkCopied(false);
        setLineageLinkCopyFeedback(null);
      }, 2_000);
    } catch {
      setLineageLinkCopyFeedback(AUDIT_EVIDENCE_CONTROL_LINEAGE_COPY_LINK_FAILED_MESSAGE);
    }
  }, []);

  const toggleChainExpanded = useCallback(() => {
    setChainExpanded((value) => !value);
  }, [setChainExpanded]);

  useAuditEvidenceControlLineageShortcuts(
    {
      toggleChain: toggleChainExpanded,
      copyLineageLink: () => {
        void onCopyLineageLink();
      },
      downloadPackage: () => {
        void onDownloadEvidencePackage();
      },
      lineageLoaded: lineageQuery.data != null,
    },
    { enabled: !lineageQuery.isPending && !lineageQuery.isError },
  );

  const packageDownloadDescribedBy = [
    AUDIT_EVIDENCE_CONTROL_LINEAGE_SNAPSHOT_SCOPE_NOTE_ID,
    packageDownloadError != null ? "audit-evidence-package-download-error" : null,
  ]
    .filter((value): value is string => value != null)
    .join(" ");

  return (
    <OperatorPageContainer
      variant="dashboard"
      className={cn(OPERATOR_LAYOUT.sectionStack, "max-w-none")}
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
        metadata={
          <div
            className="flex flex-wrap items-center gap-3"
            data-testid="audit-evidence-lineage-route-metadata"
          >
            <span className={cn("inline-flex items-center gap-1 font-mono text-xs text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Assessment {formatShortId(props.assessmentId)}
              <CopyIdButton value={props.assessmentId} aria-label="Copy assessment ID" />
            </span>
            <span className={cn("inline-flex items-center gap-1 font-mono text-xs text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Snapshot {formatShortId(props.snapshotId)}
              <CopyIdButton value={props.snapshotId} aria-label="Copy snapshot ID" />
            </span>
            <span className={cn("inline-flex items-center gap-1 font-mono text-xs text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Control {formatShortId(props.controlId)}
              <CopyIdButton value={props.controlId} aria-label="Copy control ID" />
            </span>
          </div>
        }
        actions={
          <div className="flex max-w-xl flex-col items-end gap-2">
            <div className="flex flex-wrap items-start justify-end gap-2">
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href={lookupPath} data-testid="audit-evidence-lineage-back-to-lookup-header">
                  {AUDIT_EVIDENCE_CONTROL_LINEAGE_BACK_TO_LOOKUP_ACTION}
                </Link>
              </Button>
              <div className="flex min-w-[12rem] max-w-sm flex-col gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={packageDownloadBusy}
                  data-testid="audit-evidence-package-download"
                  aria-describedby={packageDownloadDescribedBy}
                  onClick={() => {
                    void onDownloadEvidencePackage();
                  }}
                >
                  {packageDownloadBusy
                    ? AUDIT_EVIDENCE_CONTROL_LINEAGE_PACKAGE_DOWNLOAD_BUSY
                    : AUDIT_EVIDENCE_CONTROL_LINEAGE_PACKAGE_DOWNLOAD_ACTION}
                </Button>
                <p
                  id={AUDIT_EVIDENCE_CONTROL_LINEAGE_SNAPSHOT_SCOPE_NOTE_ID}
                  className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}
                  data-testid="audit-evidence-control-lineage-snapshot-scope-note"
                >
                  {AUDIT_EVIDENCE_CONTROL_LINEAGE_SNAPSHOT_SCOPE_NOTE}
                </p>
              </div>
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
              className={cn("m-0 text-right text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}
              data-testid="audit-evidence-control-lineage-keyboard-affordance"
            >
              <ShortcutHint shortcut="F1" /> page help; <ShortcutHint shortcut="Ctrl+K" /> search;{" "}
              <ShortcutHint shortcut={AUDIT_EVIDENCE_CONTROL_LINEAGE_CHAIN_TOGGLE_SHORTCUT} /> chain;{" "}
              <ShortcutHint shortcut={AUDIT_EVIDENCE_CONTROL_LINEAGE_COPY_LINK_SHORTCUT} /> copy link;{" "}
              <ShortcutHint shortcut={AUDIT_EVIDENCE_CONTROL_LINEAGE_PACKAGE_DOWNLOAD_SHORTCUT} /> download.
              <span className="sr-only">{keyboardAffordance}</span>
            </p>
          </div>
        }
      />

      {packageDownloadError != null ? (
        <div id="audit-evidence-package-download-error">
          <OperatorMutationInlineError
            message={packageDownloadError}
            testId="audit-evidence-package-download-error"
          />
        </div>
      ) : null}

      <div
        aria-live="polite"
        className="sr-only"
        data-testid="audit-evidence-lineage-live-region"
      >
        {lineageLinkCopyFeedback}
        {packageDownloadAnnouncement}
      </div>

      <div
        id={AUDIT_EVIDENCE_CONTROL_LINEAGE_PRIMARY_CONTENT_ID}
        className={cn("min-w-0 space-y-4 scroll-mt-24")}
        data-testid="audit-evidence-control-lineage-primary-content"
      >
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
          <section className="space-y-3" aria-label="Control attestation status">
            <div className="flex flex-wrap items-center gap-3">
              <StatusTag
                kind={checkboxPresentation.kind}
                label={checkboxPresentation.label}
                data-testid="audit-evidence-lineage-status-tag"
              />
            </div>
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="audit-evidence-lineage-evaluation-context"
            >
              {formatAuditLineageEvaluationContext(lineage)}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="audit-evidence-positive-checkbox"
                aria-expanded={chainExpanded}
                aria-controls={chainRegionId}
                aria-label={chainToggleLabel}
                onClick={() => setChainExpanded((value) => !value)}
              >
                {chainToggleLabel}
              </Button>
            </div>

            <div id={chainRegionId}>
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
            </div>

            <AuditEvidenceLineageRouteIdentifiersDisclosure
              assessmentId={props.assessmentId}
              snapshotId={props.snapshotId}
              controlId={props.controlId}
            />
          </section>
        ) : null}

        <AuditEvidenceControlLineageClaimOrientationStrip />
      </div>
    </OperatorPageContainer>
  );
}
