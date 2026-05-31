"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createRiskException,
  defaultRiskExceptionExpiresAtUtc,
  listFindingDispositions,
  listRiskExceptions,
  recordFindingDisposition,
  renewRiskException,
  revokeRiskException,
  type FindingDispositionEvent,
  type FindingDispositionKind,
  type RiskExceptionRecord,
} from "@/lib/api/governance-stickiness-api";

const DISPOSITION_OPTIONS: FindingDispositionKind[] = [
  "Accepted",
  "Deferred",
  "NeedsEvidence",
  "Remediated",
  "RejectedAsNotApplicable",
];

export type FindingInspectGovernanceStickinessPanelProps = {
  readonly findingId: string;
  readonly runId: string;
};

/** TB-058/TB-059 operator workflow on the finding inspector (Batch B). */
export function FindingInspectGovernanceStickinessPanel({
  findingId,
  runId,
}: FindingInspectGovernanceStickinessPanelProps) {
  const [history, setHistory] = useState<FindingDispositionEvent[]>([]);
  const [activeWaiver, setActiveWaiver] = useState<RiskExceptionRecord | null>(null);
  const [disposition, setDisposition] = useState<FindingDispositionKind>("Accepted");
  const [rationale, setRationale] = useState("");
  const [revisitDueUtc, setRevisitDueUtc] = useState("");
  const [evidenceRequestText, setEvidenceRequestText] = useState("");
  const [waiverRationale, setWaiverRationale] = useState("");
  const [waiverOwnerUserId, setWaiverOwnerUserId] = useState("");
  const [waiverExpiresAtUtc, setWaiverExpiresAtUtc] = useState(defaultRiskExceptionExpiresAtUtc());
  const [waiverEvidenceRef, setWaiverEvidenceRef] = useState("");
  const [renewExpiresAtUtc, setRenewExpiresAtUtc] = useState(defaultRiskExceptionExpiresAtUtc());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async (): Promise<void> => {
    const [dispositions, waivers] = await Promise.all([
      listFindingDispositions(findingId),
      listRiskExceptions(),
    ]);

    setHistory(dispositions);
    setActiveWaiver(
      waivers.find((w) => w.findingId === findingId && w.status === "Active") ?? null,
    );
  }, [findingId]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await reload();
      } catch {
        if (!cancelled) setErrorMessage("Governance workflow data unavailable for this finding.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reload]);

  async function submitDisposition(): Promise<void> {
    setBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await recordFindingDisposition(findingId, {
        disposition,
        rationale: rationale.trim().length > 0 ? rationale.trim() : undefined,
        runId,
        revisitDueUtc: disposition === "Deferred" && revisitDueUtc.trim().length > 0 ? revisitDueUtc : undefined,
        evidenceRequestText:
          disposition === "NeedsEvidence" && evidenceRequestText.trim().length > 0
            ? evidenceRequestText.trim()
            : undefined,
      });

      setStatusMessage("Disposition recorded.");
      await reload();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to record disposition.");
    } finally {
      setBusy(false);
    }
  }

  async function submitWaiver(): Promise<void> {
    setBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await createRiskException({
        findingId,
        runId,
        ownerUserId: waiverOwnerUserId.trim(),
        rationale: waiverRationale.trim(),
        evidenceRef: waiverEvidenceRef.trim(),
        expiresAtUtc: waiverExpiresAtUtc,
      });

      setStatusMessage("Risk exception (waiver) created.");
      await reload();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create waiver.");
    } finally {
      setBusy(false);
    }
  }

  async function renewWaiver(): Promise<void> {
    if (activeWaiver === null) return;

    setBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await renewRiskException(activeWaiver.riskExceptionId, {
        expiresAtUtc: renewExpiresAtUtc,
        evidenceRef: waiverEvidenceRef.trim().length > 0 ? waiverEvidenceRef.trim() : activeWaiver.evidenceRef ?? undefined,
      });

      setStatusMessage("Waiver renewed.");
      await reload();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to renew waiver.");
    } finally {
      setBusy(false);
    }
  }

  async function revokeWaiver(): Promise<void> {
    if (activeWaiver === null) return;

    setBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await revokeRiskException(activeWaiver.riskExceptionId);
      setStatusMessage("Waiver revoked.");
      await reload();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to revoke waiver.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-neutral-200 dark:border-neutral-800">
      <CardHeader>
        <CardTitle className="text-base">Governance disposition &amp; waiver</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        {statusMessage ? <p className="m-0 text-teal-800 dark:text-teal-300">{statusMessage}</p> : null}
        {errorMessage ? <p className="m-0 text-red-700 dark:text-red-400">{errorMessage}</p> : null}

        <section className="space-y-3">
          <h3 className="m-0 text-sm font-semibold">Record disposition</h3>
          <label className="grid gap-1">
            <span className="font-medium">Disposition</span>
            <select
              className="rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
              value={disposition}
              onChange={(event) => setDisposition(event.target.value as FindingDispositionKind)}
            >
              {DISPOSITION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="font-medium">Rationale</span>
            <textarea
              className="min-h-20 rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
              value={rationale}
              onChange={(event) => setRationale(event.target.value)}
            />
          </label>
          {disposition === "Deferred" ? (
            <label className="grid gap-1">
              <span className="font-medium">Revisit due (UTC ISO)</span>
              <input
                type="datetime-local"
                className="rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
                value={revisitDueUtc}
                onChange={(event) => setRevisitDueUtc(event.target.value)}
              />
            </label>
          ) : null}
          {disposition === "NeedsEvidence" ? (
            <label className="grid gap-1">
              <span className="font-medium">Evidence request</span>
              <textarea
                className="min-h-16 rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
                value={evidenceRequestText}
                onChange={(event) => setEvidenceRequestText(event.target.value)}
              />
            </label>
          ) : null}
          <Button type="button" size="sm" disabled={busy} onClick={() => void submitDisposition()}>
            Save disposition
          </Button>
        </section>

        <section className="space-y-3">
          <h3 className="m-0 text-sm font-semibold">Risk exception (waiver)</h3>
          {activeWaiver ? (
            <p className="m-0 text-neutral-700 dark:text-neutral-300">
              Active waiver expires {activeWaiver.expiresAtUtc} — owner {activeWaiver.ownerUserId}
            </p>
          ) : (
            <>
              <label className="grid gap-1">
                <span className="font-medium">Owner user id</span>
                <input
                  className="rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
                  value={waiverOwnerUserId}
                  onChange={(event) => setWaiverOwnerUserId(event.target.value)}
                />
              </label>
              <label className="grid gap-1">
                <span className="font-medium">Rationale</span>
                <textarea
                  className="min-h-16 rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
                  value={waiverRationale}
                  onChange={(event) => setWaiverRationale(event.target.value)}
                />
              </label>
              <label className="grid gap-1">
                <span className="font-medium">Evidence reference (required)</span>
                <input
                  className="rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
                  value={waiverEvidenceRef}
                  onChange={(event) => setWaiverEvidenceRef(event.target.value)}
                  placeholder="Artifact URI, ticket id, or audit correlation"
                />
              </label>
              <label className="grid gap-1">
                <span className="font-medium">Expires (UTC ISO)</span>
                <input
                  type="datetime-local"
                  className="rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
                  value={waiverExpiresAtUtc.slice(0, 16)}
                  onChange={(event) => setWaiverExpiresAtUtc(new Date(event.target.value).toISOString())}
                />
              </label>
              <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void submitWaiver()}>
                Create waiver (default 90 days, max 365)
              </Button>
            </>
          )}
          {activeWaiver ? (
            <Button type="button" size="sm" variant="destructive" disabled={busy} onClick={() => void revokeWaiver()}>
              Revoke waiver
            </Button>
          ) : null}
        </section>

        {history.length > 0 ? (
          <section className="space-y-2">
            <h3 className="m-0 text-sm font-semibold">Disposition history</h3>
            <ul className="m-0 list-disc space-y-1 pl-5">
              {history.map((event) => (
                <li key={event.eventId}>
                  {event.disposition} — {event.occurredAtUtc}
                  {event.rationale ? ` — ${event.rationale}` : ""}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}
