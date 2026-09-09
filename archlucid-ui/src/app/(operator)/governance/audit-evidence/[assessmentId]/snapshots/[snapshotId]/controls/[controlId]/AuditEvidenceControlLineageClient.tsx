"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { Button } from "@/components/ui/button";
import { useAuditEvidenceLineageQuery } from "@/hooks/use-audit-evidence-lineage-query";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { deriveAuditLineageCheckboxPresentation } from "@/lib/audit-evidence-lineage-presentation";
import { AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH } from "@/lib/audit-evidence-lineage-route";
import { auditEvidenceLineageBlockedReason } from "@/lib/governance/audit-evidence-lineage-blocked-reason";
import { downloadAuditEvidencePackageZip } from "@/lib/governance/audit-evidence-package-api";
import {
  AUDIT_EVIDENCE_CONTROL_LINEAGE_BACK_TO_LOOKUP_ACTION,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_CLAIM_DISCIPLINE,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_COLLAPSE_ACTION,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_ERROR_BODY,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_ERROR_TITLE,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_EXPAND_ACTION,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_LOADING_LABEL,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_PAGE_LEAD,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_PAGE_TITLE,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_PRIMARY_CONTENT_ID,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_RETRY_ACTION,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_SKIP_LINK_LABEL,
} from "@/lib/audit-evidence-page-copy";

import {
  auditEvidenceLineageChainHrefFromSearch,
  parseAuditEvidenceLineageChainOpenFromSearch,
} from "@/lib/governance/audit-evidence-lineage-chain-url";
import { showError } from "@/lib/toast";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

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
  const lineageChainOpenParam = searchParams.get("lineageChainOpen");
  const lineageQuery = useAuditEvidenceLineageQuery(props.assessmentId, props.snapshotId, props.controlId);
  const [packageDownloadBusy, setPackageDownloadBusy] = useState(false);
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

  const onDownloadEvidencePackage = useCallback(async () => {
    setPackageDownloadBusy(true);

    try {
      await downloadAuditEvidencePackageZip(props.assessmentId, props.snapshotId);
    } catch (error: unknown) {
      showError(
        "Audit evidence package download failed",
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setPackageDownloadBusy(false);
    }
  }, [props.assessmentId, props.snapshotId]);

  const onDownloadEvidencePackage = useCallback(async () => {
    setPackageDownloadBusy(true);

    try {
      await downloadAuditEvidencePackageZip(props.assessmentId, props.snapshotId);
    } catch (error: unknown) {
      showError(
        "Audit evidence package download failed",
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setPackageDownloadBusy(false);
    }
  }, [props.assessmentId, props.snapshotId]);

  const onDownloadEvidencePackage = useCallback(async () => {
    setPackageDownloadBusy(true);

    try {
      await downloadAuditEvidencePackageZip(props.assessmentId, props.snapshotId);
    } catch (error: unknown) {
      showError(
        "Audit evidence package download failed",
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setPackageDownloadBusy(false);
    }
  }, [props.assessmentId, props.snapshotId]);

  return (
    <div className="space-y-6 p-4" data-testid="audit-evidence-control-lineage-page">
      <header className="space-y-2">
        <p className={OPERATOR_TYPOGRAPHY.helper}>
          <a className="underline" href={AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH}>Audit evidence lineage</a>
        </p>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Audit control evidence lineage</h1>
          Chain of custody from control through requirements, evaluation, and collected evidence. Read-only.
        <p className={cnMonoIds}>
          assessmentId={props.assessmentId} · snapshotId={props.snapshotId} · controlId={props.controlId}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={packageDownloadBusy}
            data-testid="audit-evidence-package-download"
            onClick={() => {
              void onDownloadEvidencePackage();
            }}
          >
            {packageDownloadBusy ? "Preparing package…" : "Download evidence package (ZIP)"}
          </Button>
        </div>
      </header>

      {lineageQuery.isPending ? (
        <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="audit-evidence-lineage-loading">Loading lineage…</p>
      ) : null}

      {lineageQuery.isError ? (
        <div data-testid="audit-evidence-lineage-error">
          <StatusTag kind="needs-attention" label="Lineage unavailable" />
          <p className={OPERATOR_TYPOGRAPHY.helper}>
            {lineageBlockedReason ?? "Could not load chain of custody for this control."}
          </p>


      {lineage ? (
        <>
          <section className="flex flex-wrap items-center gap-3" aria-label="Control support status">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded border border-border bg-card px-3 py-2"
              data-testid="audit-evidence-positive-checkbox"
              aria-expanded={chainExpanded}
              onClick={() => setChainExpanded((value) => !value)}
    <div className="space-y-4 p-4" data-testid="audit-evidence-control-lineage-page">
      {buyerPolishedShell ? (
        <a
          href={`#${AUDIT_EVIDENCE_CONTROL_LINEAGE_PRIMARY_CONTENT_ID}`}
          className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
        >
          {AUDIT_EVIDENCE_CONTROL_LINEAGE_SKIP_LINK_LABEL}
        </a>

      <OperatorPageHeader
        title={AUDIT_EVIDENCE_CONTROL_LINEAGE_PAGE_TITLE}
        subtitle={AUDIT_EVIDENCE_CONTROL_LINEAGE_PAGE_LEAD}
        claimDiscipline={AUDIT_EVIDENCE_CONTROL_LINEAGE_CLAIM_DISCIPLINE}
        claimDisciplineTestId="audit-evidence-control-lineage-claim-discipline"
        titleTestId="audit-evidence-control-lineage-page-title"
        breadcrumb={buyerPolishedShell ? <AuditEvidenceControlLineageBreadcrumb /> : undefined}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={packageDownloadBusy}
              data-testid="audit-evidence-package-download"
              onClick={() => {
                void onDownloadEvidencePackage();
              }}
            >
              {packageDownloadBusy ? "Preparing package…" : "Download evidence package (ZIP)"}
            </Button>
            <PageContextualHelpButton />
          </div>
        }
      />

      <main
        id={buyerPolishedShell ? AUDIT_EVIDENCE_CONTROL_LINEAGE_PRIMARY_CONTENT_ID : undefined}
        className={cn("min-w-0 space-y-4", buyerPolishedShell ? "scroll-mt-24" : undefined)}
        data-testid="audit-evidence-control-lineage-primary-content"
      >
        {buyerPolishedShell ? (
          <AuditEvidenceLineageRouteIdentifiersDisclosure
            assessmentId={props.assessmentId}
            snapshotId={props.snapshotId}
            controlId={props.controlId}
          />
        ) : (
          <p className={cn("m-0 font-mono text-xs break-all text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            assessmentId={props.assessmentId} · snapshotId={props.snapshotId} · controlId={props.controlId}
          </p>
        )}

        {lineageQuery.isPending ? (
          buyerPolishedShell ? (
            <OperatorLoadingNotice data-testid="audit-evidence-lineage-loading">
              {AUDIT_EVIDENCE_CONTROL_LINEAGE_LOADING_LABEL}
            </OperatorLoadingNotice>
          ) : (
            <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="audit-evidence-lineage-loading">
              Loading lineage…
            </p>
          )
        ) : null}

        {lineageQuery.isError ? (
          <div data-testid="audit-evidence-lineage-error">
            {buyerPolishedShell ? (
              <EnterpriseCompactEmptyState
                role="alert"
                title={AUDIT_EVIDENCE_CONTROL_LINEAGE_ERROR_TITLE}
                description={AUDIT_EVIDENCE_CONTROL_LINEAGE_ERROR_BODY}
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
                        href={AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH}
                        data-testid="audit-evidence-lineage-back-to-lookup"
                      >
                        {AUDIT_EVIDENCE_CONTROL_LINEAGE_BACK_TO_LOOKUP_ACTION}
                      </Link>
                    </Button>
                  </div>
                }
              />
            ) : (
              <>
                <StatusTag kind="needs-attention" label="Lineage unavailable" />
                <p className={OPERATOR_TYPOGRAPHY.helper}>
                  {lineageBlockedReason ?? "Could not load chain of custody for this control."}
                </p>
              </>
            )}
          </div>
        ) : null}

        {lineage ? (
          <>
            <section className="flex flex-wrap items-center gap-3" aria-label="Control support status">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="inline-flex items-center gap-2"
                data-testid="audit-evidence-positive-checkbox"
                aria-expanded={chainExpanded}
                aria-label={chainToggleLabel}
                onClick={() => setChainExpanded((value) => !value)}
              >
                <span
                  aria-hidden="true"
                  className={
                    lineage.readyForPositiveCheckbox
                      ? "text-emerald-600"
                      : "text-al-text-secondary line-through"
                  }
                >
                  ✓
                </span>
                <StatusTag kind={checkboxPresentation!.kind} label={checkboxPresentation!.label} />
              </Button>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {checkboxPresentation!.detail}
              </p>
              {buyerPolishedShell ? (
                <Link href={AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH} className={OPERATOR_LINK.inline}>
                  {AUDIT_EVIDENCE_CONTROL_LINEAGE_BACK_TO_LOOKUP_ACTION}
                </Link>
              ) : null}
            </section>

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
          </>
        ) : null}

        {buyerPolishedShell ? <AuditEvidenceControlLineageClaimOrientationStrip /> : null}
      </main>
    </div>
  );
}
