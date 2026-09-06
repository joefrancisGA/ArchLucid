"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { LayerHeader } from "@/components/LayerHeader";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
  governanceInfrastructureResourceHubPath,
} from "@/lib/governance/governance-infrastructure-route-paths";
import {
  fetchInfraEvidenceSnapshots,
} from "@/lib/infra-evidence/infra-evidence-drift-api";
import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import {
  approveRemediationInstance,
  assignRemediationWave,
  closeRemediationInstance,
  createRemediationInstance,
  executeRemediationInstance,
  fetchRemediationFactorySummary,
  fetchRemediationInstanceDetail,
  fetchRemediationInstances,
  fetchRemediationPrioritizedFindings,
  fetchRemediationWaves,
  formatInfraEvidenceRemediationApiError,
  matchOperationalFinding,
  runRemediationPreflight,
  verifyRemediationInstance,
} from "@/lib/infra-evidence/infra-evidence-remediation-api";
import {
  canApproveRemediationInstance,
  canAssignRemediationWave,
  canCloseRemediationInstance,
  canExecuteRemediationInstance,
  canRunRemediationPreflight,
  canVerifyRemediationInstance,
  isRemediationTransitionBlocked,
  mapRemediationInstanceStatusToColumn,
} from "@/lib/infra-evidence/infra-evidence-remediation-stages";
import {
  REMEDIATION_EXECUTE_DISCLAIMER,
  REMEDIATION_WORKBENCH_COLUMNS,
  type RemediationInstanceDetail,
  type RemediationInstanceSummary,
  type RemediationWorkbenchColumn,
} from "@/lib/infra-evidence/infra-evidence-remediation-types";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

function buildDiagramReconcileHref(correspondenceId: string | null): string | null {
  if (correspondenceId == null || correspondenceId.trim().length === 0) {
    return null;
  }

  const params = new URLSearchParams({ reconcileFilter: "Conflict", correspondenceId: correspondenceId.trim() });

  return `${GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH}?${params.toString()}`;
}

export function RemediationWorkbenchClient() {
  const searchParams = useSearchParams();
  const urlFindingId = searchParams.get("findingId")?.trim() ?? "";
  const urlInstanceId = searchParams.get("instanceId")?.trim() ?? "";
  const urlCorrespondenceId = searchParams.get("correspondenceId")?.trim() ?? "";

  const [instances, setInstances] = useState<RemediationInstanceSummary[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState(urlInstanceId);
  const [detail, setDetail] = useState<RemediationInstanceDetail | null>(null);
  const [snapshots, setSnapshots] = useState<InfraEvidenceSnapshotSummary[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState("");
  const [waves, setWaves] = useState<Array<{ waveId: string; name: string }>>([]);
  const [selectedWaveId, setSelectedWaveId] = useState("");
  const [summaryOpenFindings, setSummaryOpenFindings] = useState(0);
  const [summaryRemediatedWeek, setSummaryRemediatedWeek] = useState(0);
  const [summaryBlocked, setSummaryBlocked] = useState(0);
  const [rankedFindings, setRankedFindings] = useState<Array<{ findingId: string; explanationSummary: string }>>([]);
  const [wavePlanner, setWavePlanner] = useState<Array<{ waveId: string; name: string; memberCount: number; targetSize: number | null }>>([]);
  const [findingIdInput, setFindingIdInput] = useState(urlFindingId);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const groupedInstances = useMemo(() => {
    const groups = new Map<RemediationWorkbenchColumn, RemediationInstanceSummary[]>();

    for (const column of REMEDIATION_WORKBENCH_COLUMNS) {
      groups.set(column.id, []);
    }

    for (const instance of instances) {
      const column = mapRemediationInstanceStatusToColumn(instance.status);
      groups.get(column)?.push(instance);
    }

    return groups;
  }, [instances]);

  const loadWorkbench = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const [instanceRows, summary, prioritized, waveRows, snapshotResponse] = await Promise.all([
        fetchRemediationInstances(),
        fetchRemediationFactorySummary(),
        fetchRemediationPrioritizedFindings(),
        fetchRemediationWaves(),
        fetchInfraEvidenceSnapshots(1, 20),
      ]);

      setInstances(instanceRows);
      setSummaryOpenFindings(summary.factoryMetrics.openFindings);
      setSummaryRemediatedWeek(summary.factoryMetrics.remediatedThisWeek);
      setSummaryBlocked(summary.factoryMetrics.businessBlockedCount);
      setRankedFindings(
        prioritized.map((row) => ({
          findingId: row.findingId,
          explanationSummary: row.explanationSummary,
        })),
      );
      setWavePlanner(
        summary.waves.map((wave) => ({
          waveId: wave.waveId,
          name: wave.name,
          memberCount: wave.memberCount,
          targetSize: wave.targetSize,
        })),
      );
      setWaves(waveRows);
      setSnapshots(snapshotResponse.items ?? []);

      if (selectedSnapshotId.length === 0 && (snapshotResponse.items?.length ?? 0) > 0) {
        setSelectedSnapshotId(snapshotResponse.items![0].snapshotId);
      }

      if (selectedWaveId.length === 0 && waveRows.length > 0) {
        setSelectedWaveId(waveRows[0].waveId);
      }
    } catch (error: unknown) {
      setLoadError(formatInfraEvidenceRemediationApiError(error));
    } finally {
      setLoading(false);
    }
  }, [selectedSnapshotId, selectedWaveId]);

  const loadDetail = useCallback(async (instanceId: string) => {
    if (instanceId.length === 0) {
      setDetail(null);
      return;
    }

    setDetailLoading(true);

    try {
      const response = await fetchRemediationInstanceDetail(instanceId);
      setDetail(response);
    } catch (error: unknown) {
      setLoadError(formatInfraEvidenceRemediationApiError(error));
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkbench();
  }, [loadWorkbench]);

  useEffect(() => {
    if (urlInstanceId.length > 0) {
      setSelectedInstanceId(urlInstanceId);
    }
  }, [urlInstanceId]);

  useEffect(() => {
    void loadDetail(selectedInstanceId);
  }, [loadDetail, selectedInstanceId]);

  const refreshAfterAction = async (instanceId: string | null) => {
    await loadWorkbench();

    if (instanceId != null && instanceId.length > 0) {
      setSelectedInstanceId(instanceId);
      await loadDetail(instanceId);
    }
  };

  const runCreateFromFinding = async () => {
    const findingId = findingIdInput.trim();

    if (findingId.length === 0) {
      return;
    }

    setActionBusy(true);
    setActionMessage(null);

    try {
      await matchOperationalFinding(findingId);
      const result = await createRemediationInstance(findingId);

      if (!result.succeeded) {
        setActionMessage(result.blockers.join(" ") || result.errorMessage || "Create failed.");
        return;
      }

      if (result.instanceId != null) {
        setSelectedInstanceId(result.instanceId);
      }

      await refreshAfterAction(result.instanceId);
    } catch (error: unknown) {
      setActionMessage(formatInfraEvidenceRemediationApiError(error));
    } finally {
      setActionBusy(false);
    }
  };

  const runLifecycleAction = async (action: () => Promise<{ succeeded: boolean; instanceId: string | null; blockers: string[]; errorMessage: string | null }>) => {
    setActionBusy(true);
    setActionMessage(null);

    try {
      const result = await action();

      if (!result.succeeded) {
        setActionMessage(result.blockers.join(" ") || result.errorMessage || "Action blocked.");
      }

      await refreshAfterAction(result.instanceId ?? selectedInstanceId);
    } catch (error: unknown) {
      setActionMessage(formatInfraEvidenceRemediationApiError(error));
    } finally {
      setActionBusy(false);
    }
  };

  const selectedStatus = detail?.instance.status ?? null;
  const executionSnapshotId = detail?.instance.executionSnapshotId ?? null;
  const blockers = detail?.instance.status === "PreflightBlocked" ? ["Preflight blocked"] : [];
  const transitionsBlocked = selectedStatus != null && isRemediationTransitionBlocked(selectedStatus, blockers);

  const snapshotOptions = useMemo(() => {
    if (selectedStatus !== "Executed" || executionSnapshotId == null || executionSnapshotId.length === 0) {
      return snapshots;
    }

    return snapshots.filter((snapshot) => snapshot.snapshotId !== executionSnapshotId);
  }, [executionSnapshotId, selectedStatus, snapshots]);

  useEffect(() => {
    if (selectedStatus !== "Executed" || snapshotOptions.length === 0) {
      return;
    }

    const currentIsEligible = snapshotOptions.some((snapshot) => snapshot.snapshotId === selectedSnapshotId);

    if (!currentIsEligible) {
      setSelectedSnapshotId(snapshotOptions[0].snapshotId);
    }
  }, [selectedSnapshotId, selectedStatus, snapshotOptions]);

  const diagramReconcileHref = buildDiagramReconcileHref(urlCorrespondenceId);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
      <LayerHeader pageKey="infrastructure-remediation" />

      <section className="grid gap-3 md:grid-cols-3" aria-label="Remediation factory metrics">
        <div className="rounded border border-border bg-card p-4">
          <p className={OPERATOR_TYPOGRAPHY.helper}>Open findings</p>
          <p className={OPERATOR_TYPOGRAPHY.sectionTitle}>{summaryOpenFindings}</p>
        </div>
        <div className="rounded border border-border bg-card p-4">
          <p className={OPERATOR_TYPOGRAPHY.helper}>Remediated this week</p>
          <p className={OPERATOR_TYPOGRAPHY.sectionTitle}>{summaryRemediatedWeek}</p>
        </div>
        <div className="rounded border border-border bg-card p-4">
          <p className={OPERATOR_TYPOGRAPHY.helper}>Preflight blocked</p>
          <p className={OPERATOR_TYPOGRAPHY.sectionTitle}>{summaryBlocked}</p>
        </div>
      </section>

      {diagramReconcileHref != null ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
          <Link className="text-al-link hover:underline" href={diagramReconcileHref}>
            Open diagram reconciliation for the originating conflict row
          </Link>
        </p>
      ) : null}

      <section className="grid gap-3 rounded border border-border bg-card p-4" aria-label="Create remediation instance">
        <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Create from finding</h2>
        <div className="flex flex-wrap gap-2">
          <input
            className="min-w-[280px] flex-1 rounded border border-input bg-background px-3 py-2 text-sm"
            data-testid="infra-remediation-finding-id"
            value={findingIdInput}
            onChange={(event) => setFindingIdInput(event.target.value)}
            placeholder="Operational finding id"
          />
          <Button
            type="button"
            size="sm"
            data-testid="infra-remediation-create"
            disabled={actionBusy || findingIdInput.trim().length === 0}
            onClick={() => void runCreateFromFinding()}
          >
            Match + create instance
          </Button>
        </div>
        {rankedFindings.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {rankedFindings.slice(0, 3).map((finding) => (
              <Button
                key={finding.findingId}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFindingIdInput(finding.findingId)}
              >
                Use ranked finding {finding.findingId.slice(0, 8)}…
              </Button>
            ))}
          </div>
        ) : null}
      </section>

      {loadError != null ? (
        <p className="m-0 text-sm text-destructive" role="alert">{loadError}</p>
      ) : null}

      {loading ? (
        <p className={cn("m-0 inline-flex items-center gap-2", OPERATOR_TYPOGRAPHY.helper)}>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading remediation factory…
        </p>
      ) : (
        <section className="grid gap-3 xl:grid-cols-6" aria-label="Remediation instance lifecycle board" data-testid="infra-remediation-board">
          {REMEDIATION_WORKBENCH_COLUMNS.map((column) => (
            <div key={column.id} className="rounded border border-border bg-card p-3" data-testid={`infra-remediation-column-${column.id}`}>
              <h3 className={OPERATOR_TYPOGRAPHY.sectionTitle}>{column.label}</h3>
              <ul className="m-0 grid gap-2 p-0">
                {(groupedInstances.get(column.id) ?? []).map((instance) => (
                  <li key={instance.instanceId}>
                    <button
                      type="button"
                      className={cn(
                        "w-full rounded border border-border px-2 py-2 text-left text-sm hover:bg-muted/40",
                        selectedInstanceId === instance.instanceId ? "bg-muted/50" : undefined,
                      )}
                      data-testid={`infra-remediation-card-${instance.instanceId}`}
                      onClick={() => setSelectedInstanceId(instance.instanceId)}
                    >
                      <div className="font-medium">{instance.patternKey}</div>
                      <div className="text-xs text-muted-foreground">{instance.status}</div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {selectedInstanceId.length > 0 ? (
        <section className="grid gap-4 rounded border border-border bg-card p-4" aria-label="Remediation instance detail" data-testid="infra-remediation-detail">
          {detailLoading || detail == null ? (
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Loading instance detail…</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>{detail.instance.patternKey}</h2>
                <StatusTag kind="in-progress" label={detail.instance.status} />
              </div>

              {detail.finding != null ? (
                <dl className="grid gap-2 text-sm">
                  <div>
                    <dt className="font-medium">Finding</dt>
                    <dd>{detail.finding.title}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Severity</dt>
                    <dd>{detail.finding.severity ?? "—"}</dd>
                  </div>
                  {detail.finding.cloudResourceId != null ? (
                    <div>
                      <dt className="font-medium">Resource hub</dt>
                      <dd>
                        <Link
                          className="text-al-link hover:underline"
                          href={governanceInfrastructureResourceHubPath(detail.finding.cloudResourceId)}
                        >
                          Open resource evidence hub
                        </Link>
                      </dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}

              {detail.activeMatch != null ? (
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                  Match: {detail.activeMatch.matchKind} — {detail.activeMatch.explainText}
                </p>
              ) : null}

              <label className="grid max-w-md gap-1 text-sm">
                <span className="font-medium">Inventory snapshot</span>
                <select
                  className="rounded border border-input bg-background px-3 py-2"
                  data-testid="infra-remediation-snapshot-picker"
                  value={selectedSnapshotId}
                  onChange={(event) => setSelectedSnapshotId(event.target.value)}
                >
                  {snapshotOptions.map((snapshot) => (
                    <option key={snapshot.snapshotId} value={snapshot.snapshotId}>
                      {snapshot.subscriptionName ?? snapshot.subscriptionId ?? "subscription"} · {snapshot.capturedUtc}
                    </option>
                  ))}
                </select>
              </label>

              {selectedStatus === "Executed" && executionSnapshotId != null ? (
                <p className={cn("m-0 text-sm", OPERATOR_TYPOGRAPHY.helper)} data-testid="infra-remediation-verify-hint">
                  Verify requires a snapshot captured after execute ({executionSnapshotId.slice(0, 8)}…). Execution
                  snapshot is excluded from the picker.
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  data-testid="infra-remediation-preflight"
                  disabled={actionBusy || transitionsBlocked || selectedStatus == null || !canRunRemediationPreflight(selectedStatus)}
                  onClick={() =>
                    void runLifecycleAction(() =>
                      runRemediationPreflight(detail.instance.instanceId, selectedSnapshotId),
                    )}
                >
                  Run preflight
                </Button>
                <Button
                  type="button"
                  size="sm"
                  data-testid="infra-remediation-approve"
                  disabled={actionBusy || transitionsBlocked || selectedStatus == null || !canApproveRemediationInstance(selectedStatus)}
                  onClick={() => void runLifecycleAction(() => approveRemediationInstance(detail.instance.instanceId))}
                >
                  Approve
                </Button>
                <label className="inline-flex items-center gap-2 text-sm">
                  <span>Wave</span>
                  <select
                    className="rounded border border-input bg-background px-2 py-1"
                    value={selectedWaveId}
                    onChange={(event) => setSelectedWaveId(event.target.value)}
                  >
                    {waves.map((wave) => (
                      <option key={wave.waveId} value={wave.waveId}>{wave.name}</option>
                    ))}
                  </select>
                </label>
                <Button
                  type="button"
                  size="sm"
                  data-testid="infra-remediation-assign-wave"
                  disabled={actionBusy || transitionsBlocked || selectedStatus == null || !canAssignRemediationWave(selectedStatus) || selectedWaveId.length === 0}
                  onClick={() =>
                    void runLifecycleAction(() =>
                      assignRemediationWave(detail.instance.instanceId, selectedWaveId),
                    )}
                >
                  Assign wave
                </Button>
                <Button
                  type="button"
                  size="sm"
                  data-testid="infra-remediation-execute"
                  disabled={actionBusy || transitionsBlocked || selectedStatus == null || !canExecuteRemediationInstance(selectedStatus)}
                  onClick={() =>
                    void runLifecycleAction(() =>
                      executeRemediationInstance(detail.instance.instanceId, selectedSnapshotId),
                    )}
                >
                  Execute (emit advisory)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  data-testid="infra-remediation-verify"
                  disabled={actionBusy || transitionsBlocked || selectedStatus == null || !canVerifyRemediationInstance(selectedStatus)}
                  onClick={() =>
                    void runLifecycleAction(() =>
                      verifyRemediationInstance(detail.instance.instanceId, selectedSnapshotId),
                    )}
                >
                  Verify
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  data-testid="infra-remediation-close"
                  disabled={actionBusy || selectedStatus == null || !canCloseRemediationInstance(selectedStatus)}
                  onClick={() => void runLifecycleAction(() => closeRemediationInstance(detail.instance.instanceId))}
                >
                  Close
                </Button>
              </div>

              <p className={cn("m-0 rounded bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)} data-testid="infra-remediation-execute-disclaimer">
                {REMEDIATION_EXECUTE_DISCLAIMER}
              </p>

              {detail.evidence.length > 0 ? (
                <div className="grid gap-2">
                  <h3 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Advisory evidence</h3>
                  {detail.evidence.map((item) => (
                    <pre
                      key={item.evidenceId}
                      className="overflow-x-auto rounded border border-border bg-muted/20 p-2 text-xs"
                      data-testid={`infra-remediation-evidence-${item.phase}`}
                    >
                      {item.payloadJson}
                    </pre>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      <section className="rounded border border-border bg-card p-4" aria-label="Wave planner read-only">
        <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Wave planner (read-only)</h2>
        {wavePlanner.length === 0 ? (
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>No remediation waves yet.</p>
        ) : (
          <ul className="m-0 grid gap-2 pl-5">
            {wavePlanner.map((wave) => (
              <li key={wave.waveId}>
                {wave.name}: {wave.memberCount}
                {wave.targetSize != null ? ` / ${wave.targetSize}` : ""} members
              </li>
            ))}
          </ul>
        )}
      </section>

      {actionMessage != null ? (
        <p className="m-0 text-sm text-muted-foreground" role="status">{actionMessage}</p>
      ) : null}
    </div>
  );
}
