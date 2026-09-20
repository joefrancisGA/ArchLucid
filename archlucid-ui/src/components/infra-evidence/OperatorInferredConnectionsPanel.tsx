"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
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
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  confirmOperatorInferredConnection,
  dismissOperatorInferredConnection,
  listOperatorInferredConnections,
} from "@/lib/infra-evidence/operator-inferred-connection-api";
import {
  operatorInferredConnectionPanelErrorFromUnknown,
  operatorInferredConnectionPanelErrorRecoveryScenario,
  type OperatorInferredConnectionPanelError,
} from "@/lib/infra-evidence/operator-inferred-connection-panel-error";
import type { OperatorInferredConnectionRow } from "@/lib/infra-evidence/operator-inferred-connection-types";
import { cn } from "@/lib/utils";

type OperatorInferredConnectionsPanelProps = {
  readonly snapshotId: string;
};

function formatEndpoint(row: OperatorInferredConnectionRow): string {
  if (row.toCatalog != null && row.toCatalog.length > 0) {
    return `${row.toHost ?? "host"} / ${row.toCatalog}`;
  }

  return row.toHost ?? row.toArmId ?? "—";
}

export function OperatorInferredConnectionsPanel(
  props: OperatorInferredConnectionsPanelProps,
): React.JSX.Element | null {
  const { snapshotId } = props;
  const [rows, setRows] = useState<OperatorInferredConnectionRow[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [panelError, setPanelError] = useState<OperatorInferredConnectionPanelError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const uploadRows = useMemo(
    () => rows.filter((row) => row.source === "upload" && row.status === "Proposed"),
    [rows],
  );

  const hasHumanConfirmed = useMemo(
    () => rows.some((row) => row.status === "Confirmed"),
    [rows],
  );

  const loadRows = useCallback(async () => {
    if (snapshotId.trim().length === 0) {
      setRows([]);
      setPanelError(null);
      return;
    }

    setLoading(true);

    try {
      const nextRows = await listOperatorInferredConnections(snapshotId);
      setRows(nextRows);
      setPanelError(null);

      if (selectedConnectionId != null && !nextRows.some((row) => row.connectionId === selectedConnectionId)) {
        setSelectedConnectionId(null);
      }
    } catch (error) {
      setPanelError(
        operatorInferredConnectionPanelErrorFromUnknown(
          error,
          "Could not load proposed connections.",
          "load",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [selectedConnectionId, snapshotId]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const onConfirm = useCallback(async () => {
    if (selectedConnectionId == null) {
      return;
    }

    setSubmitting(true);
    setPanelError(null);

    try {
      await confirmOperatorInferredConnection(snapshotId, { connectionId: selectedConnectionId });
      await loadRows();
    } catch (error) {
      setPanelError(
        operatorInferredConnectionPanelErrorFromUnknown(
          error,
          "Could not confirm the selected connection.",
          "mutation",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }, [loadRows, selectedConnectionId, snapshotId]);

  const onDismiss = useCallback(async () => {
    if (selectedConnectionId == null) {
      return;
    }

    setSubmitting(true);
    setPanelError(null);

    try {
      await dismissOperatorInferredConnection(snapshotId, { connectionId: selectedConnectionId });
      setSelectedConnectionId(null);
      await loadRows();
    } catch (error) {
      setPanelError(
        operatorInferredConnectionPanelErrorFromUnknown(
          error,
          "Could not dismiss the selected connection.",
          "mutation",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }, [loadRows, selectedConnectionId, snapshotId]);

  if (uploadRows.length === 0 && !hasHumanConfirmed && !loading && panelError == null) {
    return null;
  }

  return (
    <section
      className="rounded-md border border-al-border bg-al-surface p-4"
      data-testid="operator-inferred-connections-panel"
      aria-label="Uploaded config connection proposals"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>Uploaded config proposals</h2>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Confirm proposed hostname edges from uploaded config before they paint on Data Flow.
          </p>
          {hasHumanConfirmed ? (
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="operator-inferred-human-confirmed-caption"
            >
              Confirmed connection edges are operator assertions from uploaded config or the inference questionnaire.
            </p>
          ) : null}
        </div>

        {panelError != null ? (
          <>
            <OperatorMutationInlineError
              message={panelError.message}
              recoveryScenario={operatorInferredConnectionPanelErrorRecoveryScenario(panelError.kind)}
            />
            {panelError.kind === "load" ? (
              <Button
                type="button"
                size="sm"
                variant="primary"
                disabled={loading}
                onClick={() => void loadRows()}
                data-testid="operator-inferred-connections-retry"
              >
                Retry
              </Button>
            ) : null}
          </>
        ) : null}

        {uploadRows.length > 0 ? (
          <EnterpriseTable
            data-testid="operator-inferred-connections-table"
            ariaLabel="Proposed uploaded config connections"
          >
            <EnterpriseTableHead>
              <EnterpriseTableHeadRow>
                <EnterpriseTableHeaderCell>Select</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>From</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>To</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Setting</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Source</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
              </EnterpriseTableHeadRow>
            </EnterpriseTableHead>
            <EnterpriseTableBody>
              {uploadRows.map((row) => (
                <EnterpriseTableRow key={row.connectionId}>
                  <EnterpriseTableCell>
                    <input
                      type="radio"
                      name="operator-inferred-connection"
                      checked={selectedConnectionId === row.connectionId}
                      onChange={() => setSelectedConnectionId(row.connectionId)}
                      aria-label={`Select ${row.settingName ?? row.connectionId}`}
                    />
                  </EnterpriseTableCell>
                  <EnterpriseTableCell>{row.fromLabel ?? row.fromArmId ?? "—"}</EnterpriseTableCell>
                  <EnterpriseTableCell>{formatEndpoint(row)}</EnterpriseTableCell>
                  <EnterpriseTableCell>{row.settingName ?? "—"}</EnterpriseTableCell>
                  <EnterpriseTableCell>{row.sourceFileFormat ?? row.source}</EnterpriseTableCell>
                  <EnterpriseTableCell>{row.status}</EnterpriseTableCell>
                </EnterpriseTableRow>
              ))}
            </EnterpriseTableBody>
          </EnterpriseTable>
        ) : null}

        {uploadRows.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="primary"
              disabled={selectedConnectionId == null || submitting}
              onClick={() => void onConfirm()}
              data-testid="operator-inferred-connections-confirm"
            >
              Confirm connection
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={selectedConnectionId == null || submitting}
              onClick={() => void onDismiss()}
              data-testid="operator-inferred-connections-dismiss"
            >
              Dismiss
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
