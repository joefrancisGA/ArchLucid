"use client";

import { cn } from "@/lib/utils";
import { Lock, LockOpen } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorEmptyState, OperatorLoadingNotice, OperatorWarningCallout } from "@/components/operator/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableHeadRow,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { StatusTag } from "@/components/ui/status-tag";
import { getTechnologyLedger, patchTechnologyLedgerEntry } from "@/lib/api/technology-ledger";
import { isApiRequestError } from "@/lib/api-request-error";
import { OPERATOR_CARD, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { tryStaticDemoTechnologyLedger } from "@/lib/operator/operator-static-demo-technology-ledger";
import {
  technologyLedgerProviderLabel,
  technologyLedgerRoleLabel,
  technologyLedgerSourceLabel,
  technologyLedgerStatusTag,
} from "@/lib/technology-ledger-labels";
import { TechnologyBaselineRationaleDialog } from "@/components/reviews/technology-baseline/TechnologyBaselineRationaleDialog";
import { detectTechnologyLedgerDrift } from "@/lib/vocabulary/detect-technology-ledger-drift";
import {
  parseTechnologyBaselineEntryIdFromSearch,
  technologyBaselineRationaleHrefFromSearch,
} from "@/lib/reviews/technology-baseline-rationale-url";
import type { TechnologyLedgerEntry } from "@/types/technology-ledger";

export type TechnologyBaselinePanelProps = {
  readonly runId: string;
  readonly manifestFinalized: boolean;
  readonly buyerPolished: boolean;
  readonly usedStaticDemoRun: boolean;
  readonly warningCountDisplay: number;
};

export function TechnologyBaselinePanel({
  runId,
  manifestFinalized,
  buyerPolished,
  usedStaticDemoRun,
  warningCountDisplay,
}: TechnologyBaselinePanelProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? `/architecture/reviews/${encodeURIComponent(runId)}`;
  const searchParams = useSearchParams();
  const urlTechEntryId = parseTechnologyBaselineEntryIdFromSearch(searchParams.get("techEntryId"));
  const [entries, setEntries] = useState<TechnologyLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionEntryId, setActionEntryId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{
    message: string;
    correlationId: string | null;
  } | null>(null);
  const [rationaleDialogEntry, setRationaleDialogEntryState] = useState<TechnologyLedgerEntry | null>(null);

  const syncTechEntryToUrl = useCallback(
    (entryId: string | null) => {
      router.replace(
        technologyBaselineRationaleHrefFromSearch(searchParams.toString(), entryId, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setRationaleDialogEntry = useCallback(
    (entry: TechnologyLedgerEntry | null) => {
      setRationaleDialogEntryState(entry);
      syncTechEntryToUrl(entry?.entryId ?? null);
    },
    [syncTechEntryToUrl],
  );

  useEffect(() => {
    if (urlTechEntryId.length === 0 || entries.length === 0) {
      return;
    }

    const matched = entries.find((entry) => entry.entryId === urlTechEntryId) ?? null;

    if (matched !== null) {
      setRationaleDialogEntryState(matched);
    }
  }, [entries, urlTechEntryId]);

  const sectionTitle = buyerPolished ? "Technology choices" : "Technology baseline";

  const loadLedger = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    if (usedStaticDemoRun) {
      const seeded = tryStaticDemoTechnologyLedger(runId);

      if (seeded !== null) {
        setEntries(seeded.entries);
        setLoading(false);
        return;
      }
    }

    try {
      const response = await getTechnologyLedger(runId);
      let nextEntries = response.entries;

      if (nextEntries.length === 0 && usedStaticDemoRun) {
        const seeded = tryStaticDemoTechnologyLedger(runId);

        if (seeded !== null) {
          nextEntries = seeded.entries;
        }
      }

      setEntries(nextEntries);
    } catch (error: unknown) {
      if (isApiRequestError(error)) {
        setLoadError(error.message);
      } else {
        setLoadError(error instanceof Error ? error.message : "Could not load technology baseline.");
      }

      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [runId, usedStaticDemoRun]);

  useEffect(() => {
    void loadLedger();
  }, [loadLedger]);

  const driftWarnings = useMemo(() => detectTechnologyLedgerDrift(entries), [entries]);
  const hasAssumedRows = entries.some((entry) => entry.status === "Assumed");
  const showPreFinalizeBanner = !manifestFinalized && hasAssumedRows;
  const showConsistencyNote = warningCountDisplay > 0;

  async function runPatch(
    entryId: string,
    body: Parameters<typeof patchTechnologyLedgerEntry>[2],
  ): Promise<void> {
    setActionEntryId(entryId);
    setActionError(null);

    try {
      const response = await patchTechnologyLedgerEntry(runId, entryId, body);
      setEntries((current) =>
        current.map((row) => (row.entryId === entryId ? response.entry : row)),
      );
      await loadLedger();
    } catch (error: unknown) {
      if (isApiRequestError(error)) {
        setActionError({
          message: error.message,
          correlationId: error.correlationId,
        });
      } else {
        setActionError({
          message: error instanceof Error ? error.message : "Update failed.",
          correlationId: null,
        });
      }
    } finally {
      setActionEntryId(null);
    }
  }

  function renderActions(entry: TechnologyLedgerEntry): React.ReactNode {
    const busy = actionEntryId === entry.entryId;

    if (entry.status === "Assumed") {
      return (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => void runPatch(entry.entryId, { status: "Chosen" })}
        >
          Approve
        </Button>
      );
    }

    if (entry.status === "Chosen" && !entry.isLocked) {
      return (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => void runPatch(entry.entryId, { isLocked: true })}
        >
          Lock
        </Button>
      );
    }

    if (entry.status === "Chosen" && entry.isLocked) {
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => void runPatch(entry.entryId, { isLocked: false })}
          >
            Unlock
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => setRationaleDialogEntry(entry)}
          >
            Edit note
          </Button>
        </div>
      );
    }

    return <span className="text-al-text-secondary">—</span>;
  }

  return (
    <div
      className={cn(OPERATOR_CARD, "space-y-4")}
      data-testid="technology-baseline-panel"
    >
      <div>
        <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>{sectionTitle}</h2>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Authoritative technology choices for this review — approve agent proposals and lock rows before finalize.
        </p>
        {showConsistencyNote ? (
          <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Technology consistency checks may flag unresolved assumptions — review Assumed rows below.
          </p>
        ) : null}
      </div>

      {showPreFinalizeBanner ? (
        <OperatorWarningCallout>
          Agent-proposed technology choices still need operator approval before this review should be treated as
          authoritative. Approve Assumed rows below or adjust intake evidence.
        </OperatorWarningCallout>
      ) : null}

      {!loading && driftWarnings.length > 0 ? (
        <div className="space-y-2" data-testid="technology-baseline-drift-warnings">
          {driftWarnings.map((warning) => (
            <OperatorWarningCallout key={`${warning.code}-${warning.role}`}>
              {warning.message}
            </OperatorWarningCallout>
          ))}
        </div>
      ) : null}

      {loading ? (
        <div data-testid="technology-baseline-loading">
          <OperatorLoadingNotice>Loading technology baseline…</OperatorLoadingNotice>
        </div>
      ) : null}

      {!loading && loadError !== null ? (
        <div data-testid="technology-baseline-error">
          <OperatorApiProblem
            problem={null}
            fallbackMessage={loadError}
            variant="warning"
          />
        </div>
      ) : null}

      {!loading && loadError === null && entries.length === 0 ? (
        <div data-testid="technology-baseline-empty">
          <OperatorEmptyState
            title="No technology baseline yet"
            description="Ledger rows appear after intake seeding and agent proposals. Revisit after topology completes."
          />
        </div>
      ) : null}

      {!loading && loadError === null && entries.length > 0 ? (
        <EnterpriseTable ariaLabel="Technology baseline" data-testid="technology-baseline-table">
          <EnterpriseTableHead>
            <EnterpriseTableHeadRow>
              <EnterpriseTableHeaderCell>Role</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Technology</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Provider</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Source</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Locked</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
            </EnterpriseTableHeadRow>
          </EnterpriseTableHead>
          <EnterpriseTableBody>
            {entries.map((entry) => {
              const statusTag = technologyLedgerStatusTag(entry.status);

              return (
                <EnterpriseTableRow key={entry.entryId}>
                  <EnterpriseTableCell>{technologyLedgerRoleLabel(entry.role)}</EnterpriseTableCell>
                  <EnterpriseTableCell>
                    <div className="space-y-1">
                      <span>{entry.technologyName}</span>
                      {entry.evidenceRef !== null && entry.evidenceRef.length > 0 ? (
                        <details className="text-xs text-al-text-secondary">
                          <summary className="cursor-pointer">Evidence ref</summary>
                          <code className="mt-1 block truncate font-mono">{entry.evidenceRef}</code>
                        </details>
                      ) : null}
                    </div>
                  </EnterpriseTableCell>
                  <EnterpriseTableCell>{technologyLedgerProviderLabel(entry.providerFamily)}</EnterpriseTableCell>
                  <EnterpriseTableCell>
                    <StatusTag kind={statusTag.kind} label={statusTag.label} />
                  </EnterpriseTableCell>
                  <EnterpriseTableCell>{technologyLedgerSourceLabel(entry.source)}</EnterpriseTableCell>
                  <EnterpriseTableCell>
                    <span className="inline-flex items-center gap-1">
                      {entry.isLocked ? (
                        <Lock className="size-3.5" aria-hidden />
                      ) : (
                        <LockOpen className="size-3.5 text-al-text-secondary" aria-hidden />
                      )}
                      {entry.isLocked ? "Yes" : "No"}
                    </span>
                  </EnterpriseTableCell>
                  <EnterpriseTableCell>{renderActions(entry)}</EnterpriseTableCell>
                </EnterpriseTableRow>
              );
            })}
          </EnterpriseTableBody>
        </EnterpriseTable>
      ) : null}

      {actionError !== null ? (
        <OperatorApiProblem
          problem={null}
          fallbackMessage={actionError.message}
          correlationId={actionError.correlationId}
          variant="error"
        />
      ) : null}

      <TechnologyBaselineRationaleDialog
        open={rationaleDialogEntry !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRationaleDialogEntry(null);
          }
        }}
        initialRationale={rationaleDialogEntry?.rationale ?? ""}
        busy={rationaleDialogEntry !== null && actionEntryId === rationaleDialogEntry.entryId}
        onConfirm={(rationale) => {
          if (rationaleDialogEntry === null) {
            return;
          }

          void runPatch(rationaleDialogEntry.entryId, { rationale }).finally(() => {
            setRationaleDialogEntry(null);
          });
        }}
      />
    </div>
  );
}
