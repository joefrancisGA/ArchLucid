"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { LayerHeader } from "@/components/LayerHeader";
import { OperatorEmptyState } from "@/components/OperatorShellMessage";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
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
import {
  defaultRiskExceptionExpiresAtUtc,
  listRiskExceptions,
  renewRiskException,
  revokeRiskException,
  type RiskExceptionRecord,
} from "@/lib/api/governance-stickiness-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

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
  const [records, setRecords] = useState<RiskExceptionRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [renewExpiresAtUtc, setRenewExpiresAtUtc] = useState(defaultRiskExceptionExpiresAtUtc());
  const [renewRationale, setRenewRationale] = useState("");

  const reload = useCallback(async (): Promise<void> => {
    const rows = await listRiskExceptions();
    setRecords(sortByExpiryAsc(rows));
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoadError(null);

      try {
        await reload();
      } catch (error: unknown) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Failed to load risk exceptions.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reload]);

  const expiringSoonCount = useMemo(
    () => records.filter((row) => resolveRiskExceptionDisplayStatus(row) === "expiring-soon").length,
    [records],
  );

  async function copyFindingId(findingId: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(findingId);
    } catch {
      // Clipboard may be unavailable in non-secure contexts; ignore.
    }
  }

  async function submitRenew(record: RiskExceptionRecord): Promise<void> {
    setBusyId(record.riskExceptionId);
    setLoadError(null);

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
    if (!window.confirm(`Revoke risk exception for finding ${record.findingId}?`)) {
      return;
    }

    setBusyId(record.riskExceptionId);
    setLoadError(null);

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
    <div className="mx-auto max-w-6xl space-y-4 p-4">
      <LayerHeader pageKey="governance-workflow" />
      <OperatorPageHeader title="Risk exceptions" />
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
        Active waivers across findings in this workspace. Renew before expiry or revoke when risk is accepted or remediated.
      </p>

      {expiringSoonCount > 0 ? (
        <div
          className="rounded-md border border-l-4 border-neutral-200 border-l-[var(--al-status-warn-fg)] bg-[var(--al-status-warn-bg)] px-4 py-3 text-sm text-neutral-800 dark:border-neutral-700 dark:text-neutral-200"
          data-testid="risk-exceptions-expiring-warning"
          role="status"
        >
          {expiringSoonCount} waiver{expiringSoonCount === 1 ? "" : "s"} expire within 14 days — renew or revoke to avoid
          automatic reversion.
        </div>
      ) : null}

      {loadError ? <p className="m-0 text-sm text-red-700 dark:text-red-400">{loadError}</p> : null}

      {records.length === 0 ? (
        <OperatorEmptyState
          title="No active risk exceptions"
          description="Waivers created from the finding inspector appear here when they are active in this scope."
        />
      ) : (
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
                <EnterpriseTableRow key={record.riskExceptionId}>
                  <EnterpriseTableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="font-mono text-xs">{truncateMiddle(record.findingId, 24)}</code>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void copyFindingId(record.findingId)}
                      >
                        Copy
                      </Button>
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
                        <label className="flex flex-col gap-1 text-xs">
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
                        <label className="flex flex-col gap-1 text-xs">
                          <span>Rationale (optional)</span>
                          <input
                            className="rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
                            value={renewRationale}
                            onChange={(event) => setRenewRationale(event.target.value)}
                          />
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <Button type="submit" size="sm" disabled={busyId === record.riskExceptionId}>
                            Save renewal
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setRenewingId(null)}
                          >
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
                          disabled={busyId === record.riskExceptionId}
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
                          disabled={busyId === record.riskExceptionId}
                          onClick={() => void submitRevoke(record)}
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
      )}
    </div>
  );
}
