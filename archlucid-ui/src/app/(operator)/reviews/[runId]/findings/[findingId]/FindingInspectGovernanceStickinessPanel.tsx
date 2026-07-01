"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createRiskException,
  defaultRiskExceptionExpiresAtUtc,
  listFindingDispositions,
  listRiskExceptions,
  recordFindingDisposition,
  revokeRiskException,
  type FindingDispositionEvent,
  type FindingDispositionKind,
  type RiskExceptionRecord,
} from "@/lib/api/governance-stickiness-api";
import { upsertFindingRemediationAssignment } from "@/lib/api/finding-remediation-assignment-api";
import { BUYER_DEMO_GOVERNANCE_WORKFLOW_UNAVAILABLE } from "@/lib/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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
  readonly initialAssignedToUserId?: string | null;
  readonly initialRemediationDueUtc?: string | null;
};

/** TB-058/TB-059 operator workflow on the finding inspector (Batch B). */
export function FindingInspectGovernanceStickinessPanel({
  findingId,
  runId,
  initialAssignedToUserId = null,
  initialRemediationDueUtc = null,
}: FindingInspectGovernanceStickinessPanelProps) {
  const [history, setHistory] = useState<FindingDispositionEvent[]>([]);
  const [activeWaiver, setActiveWaiver] = useState<RiskExceptionRecord | null>(null);
  const [assignedToUserId, setAssignedToUserId] = useState(initialAssignedToUserId ?? "");
  const [remediationDueUtc, setRemediationDueUtc] = useState(
    initialRemediationDueUtc ? initialRemediationDueUtc.slice(0, 16) : "",
  );
  const [disposition, setDisposition] = useState<FindingDispositionKind>("Accepted");
  const [rationale, setRationale] = useState("");
  const [revisitDueUtc, setRevisitDueUtc] = useState("");
  const [evidenceRequestText, setEvidenceRequestText] = useState("");
  const [waiverRationale, setWaiverRationale] = useState("");
  const [waiverOwnerUserId, setWaiverOwnerUserId] = useState("");
  const [waiverExpiresAtUtc, setWaiverExpiresAtUtc] = useState(defaultRiskExceptionExpiresAtUtc());
  const [waiverEvidenceRef, setWaiverEvidenceRef] = useState("");
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
        if (!cancelled) {
          setErrorMessage(
            isBuyerPolishedOperatorShellEnv()
              ? BUYER_DEMO_GOVERNANCE_WORKFLOW_UNAVAILABLE
              : "Governance workflow data unavailable for this finding.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reload]);

  useEffect(() => {
    setAssignedToUserId(initialAssignedToUserId ?? "");
    setRemediationDueUtc(initialRemediationDueUtc ? initialRemediationDueUtc.slice(0, 16) : "");
  }, [findingId, initialAssignedToUserId, initialRemediationDueUtc]);

  async function submitRemediationAssignment(): Promise<void> {
    setBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await upsertFindingRemediationAssignment(findingId, {
        runId,
        assignedToUserId: assignedToUserId.trim().length > 0 ? assignedToUserId.trim() : null,
        remediationDueUtc:
          remediationDueUtc.trim().length > 0 ? new Date(remediationDueUtc).toISOString() : null,
      });
      setStatusMessage("Remediation assignment saved.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Remediation assignment save failed.";
      setErrorMessage(message);
    } finally {
      setBusy(false);
    }
  }

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

  async function submitExplicitRemediation(): Promise<void> {
    setBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await recordFindingDisposition(findingId, {
        disposition: "Remediated",
        rationale: rationale.trim().length > 0 ? rationale.trim() : undefined,
        runId,
      });

      setStatusMessage("Finding explicitly marked as Remediated.");
      await reload();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to record remediation.");
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
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Governance disposition &amp; waiver</CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-4", OPERATOR_TYPOGRAPHY.body)}>
        {statusMessage ? <p className="m-0 text-teal-800 dark:text-teal-300">{statusMessage}</p> : null}
        {errorMessage ? <p className="m-0 text-red-700 dark:text-red-400">{errorMessage}</p> : null}

        <section className="space-y-3">
          <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Remediation assignment</h3>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            General assignee and due date for ITSM outbound sync — separate from disposition reviewer and waiver owner.
          </p>
          <label className="grid gap-1">
            <span className="font-medium">Assigned to (user id or email)</span>
            <input
              className="rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
              value={assignedToUserId}
              onChange={(event) => setAssignedToUserId(event.target.value)}
              data-testid="finding-remediation-assignee"
            />
          </label>
          <label className="grid gap-1">
            <span className="font-medium">Remediation due (local)</span>
            <input
              type="datetime-local"
              className="rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
              value={remediationDueUtc}
              onChange={(event) => setRemediationDueUtc(event.target.value)}
              data-testid="finding-remediation-due"
            />
          </label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void submitRemediationAssignment()}
            data-testid="finding-remediation-save"
          >
            Save remediation assignment
          </Button>
        </section>

        <section className="space-y-3">
          <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Record disposition</h3>
          <div className="flex gap-2 pb-2">
            <Button 
              type="button" 
              size="sm" 
              variant="default" 
              className="bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-700"
              disabled={busy} 
              onClick={() => void submitExplicitRemediation()}
            >
              Mark as Remediated
            </Button>
          </div>
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
          <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Risk exception (waiver)</h3>
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
            <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Disposition history</h3>
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
