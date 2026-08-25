"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { GovernanceApprovalStatusBanner } from "@/components/governance/GovernanceApprovalStatusBanner";
import { CopyIdButton } from "@/components/CopyIdButton";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorSectionLoadFailure } from "@/components/operator/OperatorSectionLoadFailure";
import { LayerHeader } from "@/components/LayerHeader";
import { RiskExceptionsBreadcrumb } from "@/app/(operator)/governance/exceptions/_sections/RiskExceptionsBreadcrumb";
import { RiskExceptionsBuyerChrome } from "@/app/(operator)/governance/exceptions/_sections/RiskExceptionsBuyerChrome";
import { RiskExceptionsLoadFailure } from "@/app/(operator)/governance/exceptions/_sections/RiskExceptionsLoadFailure";
import { RiskExceptionsLoadingSkeleton } from "@/app/(operator)/governance/exceptions/_sections/RiskExceptionsLoadingSkeleton";
import { riskExceptionsPageSubtitle } from "@/app/(operator)/governance/exceptions/risk-exceptions-page-copy";
import { GOVERNANCE_EXCEPTIONS_PATH } from "@/lib/governance/governance-route-paths";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { RiskExceptionsFindingsVocabularyRail } from "@/components/RiskExceptionsFindingsVocabularyRail";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { StatusTag } from "@/components/ui/status-tag";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import {
  defaultRiskExceptionExpiresAtUtc,
  listRiskExceptions,
  renewRiskException,
  revokeRiskException,
  type RiskExceptionRecord,
} from "@/lib/api/governance-stickiness-api";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import {
  BUYER_RISK_EXCEPTIONS_EMPTY_BODY,
  BUYER_RISK_EXCEPTIONS_EMPTY_TERTIARY_ACTION,
  BUYER_RISK_EXCEPTIONS_EMPTY_TITLE,
  BUYER_RISK_EXCEPTIONS_PAGE_TITLE,
  BUYER_RISK_REGISTER_EMPTY_SECONDARY_ACTION,
} from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { whyDisabledEnterpriseMutationControl } from "@/lib/why-disabled-cta";
import { RiskExceptionsTriageFirstExpiringStrip } from "@/components/governance/RiskExceptionsTriageFirstExpiringStrip";
import { RiskExceptionsContinueLastViewedRow } from "@/components/governance/RiskExceptionsContinueLastViewedRow";
import { resolveRiskExceptionsTriageFirstExpiring } from "@/lib/governance/resolve-risk-exceptions-triage-first-expiring";
import {
  resolveContinueLastRiskException,
  writeRiskExceptionLastViewedId,
} from "@/lib/resolve-continue-last-risk-exception";
import {
  RISK_EXCEPTIONS_EMPTY_BODY,
  RISK_EXCEPTIONS_EMPTY_TITLE,
  RISK_EXCEPTIONS_EXPIRING_WARNING,
  RISK_EXCEPTIONS_PAGE_TITLE,
} from "@/lib/risk-exceptions-page";

import {
  formatRiskExceptionExpiresAtUtc,
  resolveRiskExceptionDisplayStatus,
  truncateMiddle,
  type RiskExceptionDisplayStatus,
} from "./risk-exception-status";

function statusTagFor(displayStatus: RiskExceptionDisplayStatus): {
  kind: "ready" | "needs-attention" | "blocked";
  label: string;
} {
  if (displayStatus === "expired") {
    return { kind: "blocked", label: "Expired" };
  }

  if (displayStatus === "expiring-soon") {
    return { kind: "needs-attention", label: "Expiring soon" };
  }

  return { kind: "ready", label: "Active" };
}

function riskExceptionsLoadFailureMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Failed to load risk exceptions.";
}

function sortByExpiryAsc(records: RiskExceptionRecord[]): RiskExceptionRecord[] {
  return [...records].sort((left, right) => Date.parse(left.expiresAtUtc) - Date.parse(right.expiresAtUtc));
}

function toDatetimeLocalInputValue(isoUtc: string): string {
  const parsed = new Date(isoUtc);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const pad = (value: number): string => String(value).padStart(2, "0");

  return `${parsed.getUTCFullYear()}-${pad(parsed.getUTCMonth() + 1)}-${pad(parsed.getUTCDate())}T${pad(parsed.getUTCHours())}:${pad(parsed.getUTCMinutes())}`;
}

/** TB-226 — cross-finding risk exception (waiver) register with renew/revoke. */
export default function RiskExceptionsClient() {
  const canMutate = useOperateCapability();
  const mutationDisabledHintId = "risk-exceptions-mutate-disabled-hint";
  const mutationDisabledReason = canMutate ? null : whyDisabledEnterpriseMutationControl();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const [records, setRecords] = useState<RiskExceptionRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [renewExpiresAtUtc, setRenewExpiresAtUtc] = useState(defaultRiskExceptionExpiresAtUtc());
  const [renewRationale, setRenewRationale] = useState("");
  const [pendingRevoke, setPendingRevoke] = useState<RiskExceptionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryingLoad, setRetryingLoad] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(async (): Promise<void> => {
    const rows = await listRiskExceptions();
    setRecords(sortByExpiryAsc(rows));
  }, []);

  const retryLoad = useCallback(() => {
    setLoadError(null);
    setReloadToken((value) => value + 1);
  }, []);

  useEffect(() => {
    let canceled = false;

    void (async () => {
      setLoading(true);
      setLoadError(null);

      try {
        await reload();
      } catch (error: unknown) {
        if (!canceled) {
          setLoadError(riskExceptionsLoadFailureMessage(error));
        }
      } finally {
        if (!canceled) {
          setLoading(false);
          setRetryingLoad(false);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [reload, reloadToken]);

  const expiringSoonCount = useMemo(
    () => records.filter((row) => resolveRiskExceptionDisplayStatus(row) === "expiring-soon").length,
    [records],
  );
  const triageFirstExpiringTarget = useMemo(
    () => resolveRiskExceptionsTriageFirstExpiring(records),
    [records],
  );
  const continueLastException = useMemo(
    () => resolveContinueLastRiskException(records),
    [records],
  );

  const pageTitle = buyerPolishedShell ? BUYER_RISK_EXCEPTIONS_PAGE_TITLE : RISK_EXCEPTIONS_PAGE_TITLE;
  const pageSubtitle = riskExceptionsPageSubtitle(buyerPolishedShell);

  async function submitRenew(record: RiskExceptionRecord): Promise<void> {
    if (!canMutate) {
      return;
    }

    setBusyId(record.riskExceptionId);
    setLoadError(null);
    writeRiskExceptionLastViewedId(record.riskExceptionId);

    try {
      await renewRiskException(record.riskExceptionId, {
        expiresAtUtc: renewExpiresAtUtc,
        rationale: renewRationale.trim().length > 0 ? renewRationale.trim() : undefined,
      });

      setRenewingId(null);
      setRenewRationale("");
      setRenewExpiresAtUtc(defaultRiskExceptionExpiresAtUtc());
      await reload();
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : "Failed to renew risk exception.");
    } finally {
      setBusyId(null);
    }
  }

  async function submitRevoke(record: RiskExceptionRecord): Promise<void> {
    if (!canMutate) {
      return;
    }

    setBusyId(record.riskExceptionId);
    setLoadError(null);
    writeRiskExceptionLastViewedId(record.riskExceptionId);

    try {
      await revokeRiskException(record.riskExceptionId);
      await reload();
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : "Failed to revoke risk exception.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <OperatorPageContainer variant="dashboard">
      {buyerPolishedShell ? (
        <GovernanceApprovalStatusBanner className="mb-3" />
      ) : (
        <LayerHeader pageKey="exceptions" density="compact" className="mb-3" />
      )}

      <OperatorPageHeader
        navHref={GOVERNANCE_EXCEPTIONS_PATH}
        title={pageTitle}
        subtitle={pageSubtitle}
        breadcrumb={buyerPolishedShell ? <RiskExceptionsBreadcrumb /> : undefined}
        actions={<PageContextualHelpButton />}
      />
      <RiskExceptionsBuyerChrome />
      {buyerPolishedShell ? null : (
        <RiskExceptionsFindingsVocabularyRail currentSurfaceId="risk-exceptions" />
      )}
      <div className={cn("mt-4", OPERATOR_LAYOUT.sectionStack)}>
        {loading ? <RiskExceptionsLoadingSkeleton /> : null}

        {loadError && buyerPolishedShell ? (
          <RiskExceptionsLoadFailure
            message={loadError}
            retrying={retryingLoad}
            onRetry={() => {
              setRetryingLoad(true);
              retryLoad();
            }}
          />
        ) : null}

        {loadError && !buyerPolishedShell ? (
          <OperatorSectionLoadFailure
            message={loadError}
            retrying={retryingLoad}
            testId="risk-exceptions-load-failure"
            onRetry={() => {
              setRetryingLoad(true);
              retryLoad();
            }}
          />
        ) : null}

        {!loading && !loadError && expiringSoonCount > 0 ? (
          <div
            className={cn(
              "rounded-md border border-l-4 border-neutral-200 border-l-[var(--al-status-warn-fg)] bg-[var(--al-status-warn-bg)] px-4 py-3 text-neutral-800 dark:border-neutral-700 dark:text-neutral-200",
              OPERATOR_TYPOGRAPHY.body,
            )}
            data-testid="risk-exceptions-expiring-warning"
            role="status"
          >
            {expiringSoonCount} risk exception{expiringSoonCount === 1 ? "" : "s"} {RISK_EXCEPTIONS_EXPIRING_WARNING}
          </div>
        ) : null}

        {!loading && !loadError && records.length === 0 ? (
          <EnterpriseCompactEmptyState
            testId="risk-exceptions-empty-state"
            title={buyerPolishedShell ? BUYER_RISK_EXCEPTIONS_EMPTY_TITLE : RISK_EXCEPTIONS_EMPTY_TITLE}
            description={buyerPolishedShell ? BUYER_RISK_EXCEPTIONS_EMPTY_BODY : RISK_EXCEPTIONS_EMPTY_BODY}
            actions={[
              { label: "Open findings", href: "/governance/findings", variant: "primary" },
              {
                label: buyerPolishedShell ? BUYER_RISK_REGISTER_EMPTY_SECONDARY_ACTION : "Open resolve outcomes",
                href: "/governance/approval-queue",
                variant: "outline",
              },
            ]}
            footer={
              <Link className={OPERATOR_LINK.optional} href="/architecture/reviews/new">
                {buyerPolishedShell ? BUYER_RISK_EXCEPTIONS_EMPTY_TERTIARY_ACTION : CREATE_ARCHITECTURE_LABEL}
              </Link>
            }
          />
        ) : !loading && !loadError ? (
          <>
            {continueLastException !== null ? (
              <RiskExceptionsContinueLastViewedRow
                target={continueLastException}
                onOpen={(riskExceptionId) => {
                  writeRiskExceptionLastViewedId(riskExceptionId);
                  document
                    .querySelector(`[data-risk-exception-id="${riskExceptionId}"]`)
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
              />
            ) : null}
            {triageFirstExpiringTarget !== null ? (
              <RiskExceptionsTriageFirstExpiringStrip
                target={triageFirstExpiringTarget}
                onExtend={(riskExceptionId) => {
                  setRenewingId(riskExceptionId);
                  setRenewExpiresAtUtc(defaultRiskExceptionExpiresAtUtc());
                  setRenewRationale("");
                  document
                    .querySelector(`[data-risk-exception-id="${riskExceptionId}"]`)
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
              />
            ) : null}
            <WhyDisabledCtaHint
              id={mutationDisabledHintId}
              reason={mutationDisabledReason}
              testId={mutationDisabledHintId}
            />
            <EnterpriseTable ariaLabel="Risk exceptions">
              <EnterpriseTableHead>
                <EnterpriseTableHeadRow>
                  <EnterpriseTableHeaderCell>Finding ID</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Owner</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Rationale</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Expires</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
                </EnterpriseTableHeadRow>
              </EnterpriseTableHead>
              <EnterpriseTableBody>
                {records.map((record) => {
                  const displayStatus = resolveRiskExceptionDisplayStatus(record);
                  const tag = statusTagFor(displayStatus);
                  const isRenewing = renewingId === record.riskExceptionId;

                  return (
                    <EnterpriseTableRow key={record.riskExceptionId} data-risk-exception-id={record.riskExceptionId}>
                      <EnterpriseTableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <code className={cn("font-mono", OPERATOR_TYPOGRAPHY.helper)}>
                            {truncateMiddle(record.findingId, 24)}
                          </code>
                          <CopyIdButton value={record.findingId} aria-label="Copy finding ID" />
                        </div>
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>{record.ownerUserId}</EnterpriseTableCell>
                      <EnterpriseTableCell title={record.rationale ?? undefined}>
                        {truncateMiddle(record.rationale ?? "", 80)}
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>
                        <StatusTag kind={tag.kind} label={tag.label} />
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>{formatRiskExceptionExpiresAtUtc(record.expiresAtUtc)}</EnterpriseTableCell>
                      <EnterpriseTableCell>
                        {isRenewing ? (
                          <form
                            className="flex min-w-[16rem] flex-col gap-2"
                            onSubmit={(event) => {
                              event.preventDefault();
                              void submitRenew(record);
                            }}
                          >
                            <label className={cn("flex flex-col gap-1", OPERATOR_TYPOGRAPHY.helper)}>
                              <span>New expiry (UTC)</span>
                              <input
                                type="datetime-local"
                                className="rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
                                value={toDatetimeLocalInputValue(renewExpiresAtUtc)}
                                onChange={(event) => {
                                  const next = new Date(event.target.value);

                                  if (!Number.isNaN(next.getTime())) {
                                    setRenewExpiresAtUtc(next.toISOString());
                                  }
                                }}
                              />
                            </label>
                            <label className={cn("flex flex-col gap-1", OPERATOR_TYPOGRAPHY.helper)}>
                              <span>Rationale (optional)</span>
                              <input
                                className="rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
                                value={renewRationale}
                                onChange={(event) => setRenewRationale(event.target.value)}
                              />
                            </label>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="submit"
                                size="sm"
                                disabled={busyId === record.riskExceptionId || !canMutate}
                                aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
                              >
                                Save renewal
                              </Button>
                              <Button type="button" size="sm" variant="outline" onClick={() => setRenewingId(null)}>
                                Cancel
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={busyId === record.riskExceptionId || !canMutate}
                              aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
                              onClick={() => {
                                setRenewingId(record.riskExceptionId);
                                setRenewExpiresAtUtc(defaultRiskExceptionExpiresAtUtc());
                                setRenewRationale("");
                              }}
                            >
                              Renew
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={busyId === record.riskExceptionId || !canMutate}
                              aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
                              onClick={() => {
                                setPendingRevoke(record);
                              }}
                              data-testid={`risk-exception-revoke-${record.riskExceptionId}`}
                            >
                              Revoke
                            </Button>
                          </div>
                        )}
                      </EnterpriseTableCell>
                    </EnterpriseTableRow>
                  );
                })}
              </EnterpriseTableBody>
            </EnterpriseTable>
          </>
        ) : null}
      </div>

      <ConfirmationDialog
        open={pendingRevoke !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRevoke(null);
          }
        }}
        title="Revoke risk exception?"
        description={
          pendingRevoke !== null
            ? `Revoking ends the active waiver for finding ${pendingRevoke.findingId}. The revocation is recorded on the audit trail.`
            : "Revoking ends the active waiver. The revocation is recorded on the audit trail."
        }
        confirmLabel="Revoke exception"
        variant="destructive"
        busy={pendingRevoke !== null && busyId === pendingRevoke.riskExceptionId}
        onConfirm={() => {
          if (pendingRevoke === null) {
            return;
          }

          void submitRevoke(pendingRevoke).finally(() => {
            setPendingRevoke(null);
          });
        }}
      />
    </OperatorPageContainer>
  );
}
