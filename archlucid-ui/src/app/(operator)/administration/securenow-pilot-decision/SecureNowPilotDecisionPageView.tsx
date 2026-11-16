"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { formatPartialCaptureWithSnapshotIdLine } from "@/lib/product-line/partial-capture-snapshot-id-honesty-copy";
import { buildSecureNowSecondCaptureCloudConnectionsHref } from "@/lib/product-line/securenow-second-capture-cloud-connections-return-path";
import { SECURENOW_SECOND_CAPTURE_CLOUD_CONNECTIONS_LABEL } from "@/lib/product-line/securenow-second-capture-cta-copy";

import { SecureNowPilotDispositionOutcomeRehearsalPanels } from "@/components/product-line/SecureNowPilotDispositionOutcomeRehearsalPanels";
import { SecureNowProcurementTrustStrip } from "@/components/product-line/SecureNowProcurementTrustStrip";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  loadSecureNowPilotDispositionForPath,
  persistSecureNowPilotDispositionForPath,
} from "@/lib/product-line/securenow-pilot-disposition-sync";
import { formatSecureNowPilotDispositionTenantAuditRecordedLine } from "@/lib/product-line/securenow-pilot-disposition-tenant-audit-copy";
import {
  secureNowPilotDispositionStorageKey,
  SECURENOW_PILOT_DISPOSITION_TENANT_AUDIT_SAVED_LINE,
} from "@/lib/product-line/securenow-pilot-disposition-storage";
import {
  SECURENOW_PILOT_DECISION_GUARDRAIL,
  SECURENOW_PILOT_DECISION_HEADING,
  SECURENOW_PILOT_DECISION_LEAD,
  SECURENOW_DECISION_CYCLE_GUARDRAIL,
  SECURENOW_DECISION_CYCLE_HEADING,
  SECURENOW_DECISION_CYCLE_LEAD,
  SECURENOW_DECISION_CYCLE_LOG_PATH,
  SECURENOW_DECISION_CYCLE_STALL_STEPS,
  SECURENOW_PILOT_DECISION_OUTCOMES,
  SECURENOW_PILOT_DECISION_STEPS,
} from "@/lib/product-line/securenow-pilot-decision-copy";
import { SPONSOR_PATH_DISPOSITION_SAVE_UNCHANGED_LINE } from "@/lib/product-line/sponsor-path-disposition-save-error-honesty-copy";
import { FatalPageReportProblemSupportRow } from "@/components/support/FatalPageReportProblemAction";
import { cn } from "@/lib/utils";

export function SecureNowPilotDecisionPageView(): React.JSX.Element {
  const searchParams = useSearchParams();
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();
  const pathId = searchParams.get("pathId")?.trim() ?? "";
  const storageKey = pathId.length > 0 ? secureNowPilotDispositionStorageKey(pathId) : null;
  const [outcome, setOutcome] = useState("");
  const [rationale, setRationale] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedDisposition, setSavedDisposition] = useState<{ outcome: string; rationale: string } | null>(null);
  const [tenantAuditSaved, setTenantAuditSaved] = useState(false);
  const [tenantAuditRecordedUtc, setTenantAuditRecordedUtc] = useState<string | null>(null);

  useEffect(() => {
    if (pathId.length === 0) {
      setOutcome("");
      setRationale("");
      setSavedDisposition(null);
      setTenantAuditSaved(false);
      setTenantAuditRecordedUtc(null);
      return;
    }

    let cancelled = false;

    void loadSecureNowPilotDispositionForPath(pathId).then((loaded) => {
      if (cancelled) {
        return;
      }

      if (loaded === null) {
        setOutcome("");
        setRationale("");
        setSavedDisposition(null);
        setTenantAuditSaved(false);
        setTenantAuditRecordedUtc(null);
        return;
      }

      setOutcome(loaded.record.outcome);
      setRationale(loaded.record.rationale);
      setSavedDisposition(loaded.record);
      setTenantAuditRecordedUtc(loaded.recordedUtc);

      if (loaded.recordedUtc !== null) {
        setTenantAuditSaved(true);
      } else {
        setTenantAuditSaved(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pathId]);

  const saveDisposition = () => {
    if (storageKey === null || outcome.length === 0) {
      setSaveError("Select Proceed, Extend, or Stop for a path.");
      return;
    }

    if (rationale.trim().length === 0) {
      setSaveError("Rationale is required.");
      return;
    }

    const record = { outcome, rationale: rationale.trim() };

    void persistSecureNowPilotDispositionForPath(pathId, record).then((outcome) => {
      if (outcome.status === "error") {
        setSaveError(outcome.errorMessage);
        setTenantAuditSaved(false);
        setTenantAuditRecordedUtc(null);
        return;
      }

      setSavedDisposition(record);
      setSaveError(null);
      setTenantAuditSaved(true);
      setTenantAuditRecordedUtc(outcome.recordedUtc);
    });
  };

  return (
    <OperatorPageContainer variant="full" data-testid="securenow-pilot-decision-page">
      <OperatorPageHeader title={SECURENOW_PILOT_DECISION_HEADING} subtitle={SECURENOW_PILOT_DECISION_LEAD} />

      <main className="mt-6 max-w-3xl space-y-6">
        {partialCapture ? (
          <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="securenow-pilot-decision-partial-capture">
            {formatPartialCaptureWithSnapshotIdLine(partialCaptureSnapshotId)}{" "}
            <Link
              className={OPERATOR_LINK.inline}
              href={buildSecureNowSecondCaptureCloudConnectionsHref(partialCaptureReturnPath)}
              data-testid="securenow-pilot-decision-partial-capture-cloud-connections"
            >
              {SECURENOW_SECOND_CAPTURE_CLOUD_CONNECTIONS_LABEL}
            </Link>
          </p>
        ) : null}
        <section aria-labelledby="securenow-pilot-decision-steps-heading" className="space-y-2">
          <h2 id="securenow-pilot-decision-steps-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Close the review
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            {SECURENOW_PILOT_DECISION_STEPS.map((step) => (
              <li key={step} className={OPERATOR_TYPOGRAPHY.body}>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="securenow-pilot-decision-outcomes-heading" className="space-y-2">
          <h2 id="securenow-pilot-decision-outcomes-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Outcome meanings
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            {SECURENOW_PILOT_DECISION_OUTCOMES.map((outcome) => (
              <li key={outcome} className={OPERATOR_TYPOGRAPHY.body}>
                {outcome}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="securenow-pilot-decision-disposition-heading" className="space-y-2">
          <h2 id="securenow-pilot-decision-disposition-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Path disposition
          </h2>
          <p className={OPERATOR_TYPOGRAPHY.helper}>
            {pathId.length > 0 ? `Path ${pathId}` : "No path selected. Open this page from a sponsor path."}
          </p>
          <label className="block space-y-1">
            <span className={OPERATOR_TYPOGRAPHY.helper}>Outcome</span>
            <select
              className="w-full rounded border border-border bg-background px-3 py-2"
              value={outcome}
              onChange={(event) => setOutcome(event.target.value)}
              aria-label="Path disposition outcome"
            >
              <option value="">Select an outcome</option>
              <option value="Proceed">Proceed</option>
              <option value="Extend">Extend</option>
              <option value="Stop">Stop</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span className={OPERATOR_TYPOGRAPHY.helper}>Rationale</span>
            <textarea
              className="min-h-24 w-full rounded border border-border bg-background px-3 py-2"
              value={rationale}
              onChange={(event) => setRationale(event.target.value)}
              aria-label="Path disposition rationale"
            />
          </label>
          <button type="button" className="rounded border border-border px-3 py-2" onClick={saveDisposition}>
            Save path disposition
          </button>
          {saveError !== null ? (
            <div className="space-y-1" role="alert" data-testid="securenow-pilot-decision-save-error">
              <p className="text-rose-700">{saveError}</p>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-pilot-decision-save-unchanged">
                {SPONSOR_PATH_DISPOSITION_SAVE_UNCHANGED_LINE}
              </p>
              <FatalPageReportProblemSupportRow
                surfaceId="securenow-pilot-decision-disposition-save-failure"
                errorTitle="Save path disposition"
                errorCode="securenow-pilot-decision-disposition-save-failed"
                correlationId={null}
                httpStatus={null}
              />
            </div>
          ) : null}
          {savedDisposition !== null ? (
            <p className={OPERATOR_TYPOGRAPHY.body} data-testid="securenow-pilot-decision-saved-disposition">
              Saved {savedDisposition.outcome}: {savedDisposition.rationale}
            </p>
          ) : null}
          {tenantAuditSaved ? (
            <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="securenow-pilot-decision-tenant-audit-saved">
              {SECURENOW_PILOT_DISPOSITION_TENANT_AUDIT_SAVED_LINE}
              {formatSecureNowPilotDispositionTenantAuditRecordedLine(tenantAuditRecordedUtc ?? "") != null ? (
                <>
                  {" "}
                  <span data-testid="securenow-pilot-decision-tenant-audit-recorded-utc">
                    {formatSecureNowPilotDispositionTenantAuditRecordedLine(tenantAuditRecordedUtc ?? "")}
                  </span>
                </>
              ) : null}
            </p>
          ) : null}
          <SecureNowPilotDispositionOutcomeRehearsalPanels
            outcome={outcome}
            savedOutcome={savedDisposition?.outcome ?? null}
            savedRationale={savedDisposition?.rationale ?? null}
            pathId={pathId}
            testIdPrefix="securenow-pilot-decision"
            stopHandoffTestId="securenow-pilot-decision-pilot-stop-itsm-handoff"
          />
          <p className={OPERATOR_TYPOGRAPHY.helper}>A saved disposition does not clear beta NO_GO.</p>
        </section>

        <section
          id="decision-cycle"
          data-testid="securenow-decision-cycle"
          aria-labelledby="securenow-decision-cycle-heading"
          className="space-y-2"
        >
          <h2 id="securenow-decision-cycle-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            {SECURENOW_DECISION_CYCLE_HEADING}
          </h2>
          <p className={OPERATOR_TYPOGRAPHY.body}>{SECURENOW_DECISION_CYCLE_LEAD}</p>
          <ul className="list-disc space-y-2 pl-5">
            {SECURENOW_DECISION_CYCLE_STALL_STEPS.map((step) => (
              <li key={step.label} className={OPERATOR_TYPOGRAPHY.body}>
                <Link className={OPERATOR_LINK.inline} href={step.href}>
                  {step.label}
                </Link>
                <span> — {step.note}</span>
              </li>
            ))}
          </ul>
          <p className={OPERATOR_TYPOGRAPHY.body}>{SECURENOW_DECISION_CYCLE_GUARDRAIL}</p>
          <p className={OPERATOR_TYPOGRAPHY.body}>
            <a className={OPERATOR_LINK.inline} href={SECURENOW_DECISION_CYCLE_LOG_PATH}>
              Decision cycle log
            </a>
          </p>
        </section>

        <p className={OPERATOR_TYPOGRAPHY.body}>{SECURENOW_PILOT_DECISION_GUARDRAIL}</p>
        <p className={OPERATOR_TYPOGRAPHY.body}>
          <Link className={OPERATOR_LINK.inline} href="/why-securenow#pilot-decision">
            Read the sponsor-facing decision path
          </Link>
        </p>
        <SecureNowProcurementTrustStrip />
      </main>
    </OperatorPageContainer>
  );
}
