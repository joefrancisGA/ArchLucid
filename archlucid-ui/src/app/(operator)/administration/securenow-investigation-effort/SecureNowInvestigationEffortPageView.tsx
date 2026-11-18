"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { SecureNowInvestigationEffortMissingFieldLabelsLine } from "@/components/product-line/SecureNowInvestigationEffortMissingFieldLabelsLine";
import { SecureNowInvestigationEffortScopeLine } from "@/components/product-line/SecureNowInvestigationEffortScopeLine";
import { SecureNowInvestigationEffortSyntheticExamplePanel } from "@/components/product-line/SecureNowInvestigationEffortSyntheticExamplePanel";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_INVESTIGATION_EFFORT_GUARDRAIL,
  SECURENOW_INVESTIGATION_EFFORT_HEADING,
  SECURENOW_INVESTIGATION_EFFORT_LEAD,
  SECURENOW_INVESTIGATION_EFFORT_NOTES,
  SECURENOW_INVESTIGATION_EFFORT_PARTIAL_CAPTURE_CONTEXT_LINE,
} from "@/lib/product-line/securenow-investigation-effort-copy";
import { SecureNowPartialCaptureRecoveryLinks } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import {
  isSecureNowInvestigationEffortAuditCandidate,
  persistSecureNowInvestigationEffortInputs,
  SECURENOW_INVESTIGATION_EFFORT_INPUT_STORAGE_DISCIPLINE,
  type SecureNowInvestigationEffortInputFields,
} from "@/lib/product-line/securenow-investigation-effort-input-storage";
import { resolveSecureNowInvestigationEffortResultState } from "@/lib/product-line/securenow-investigation-effort-result-state";
import { SECURENOW_INVESTIGATION_EFFORT_OPERATOR_ROI_DISCIPLINE_LINE } from "@/lib/product-line/securenow-investigation-effort-operator-roi-discipline-copy";
import { formatSecureNowInvestigationEffortBlockingBanner } from "@/lib/product-line/securenow-investigation-effort-blocking-banner-copy";
import {
  loadSecureNowInvestigationEffortInputs,
  persistSecureNowInvestigationEffortInputsToAudit,
} from "@/lib/product-line/securenow-investigation-effort-sync";

type EffortInputs = SecureNowInvestigationEffortInputFields;

const EMPTY_INPUTS: EffortInputs = {
  baselineHours: "",
  afterHours: "",
  annualInvestigations: "",
  hourlyRate: "",
  annualCost: "",
};

export function SecureNowInvestigationEffortPageView(): React.JSX.Element {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();
  const [inputs, setInputs] = useState<EffortInputs>(EMPTY_INPUTS);
  const [restoreComplete, setRestoreComplete] = useState(false);
  const inputEditsRef = useRef<Partial<EffortInputs>>({});

  useEffect(() => {
    let cancelled = false;

    void loadSecureNowInvestigationEffortInputs().then((stored) => {
      if (cancelled) {
        return;
      }

      setInputs({ ...(stored ?? EMPTY_INPUTS), ...inputEditsRef.current });
      setRestoreComplete(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!restoreComplete || Object.keys(inputEditsRef.current).length === 0) {
      return;
    }

    persistSecureNowInvestigationEffortInputs(inputs);

    if (!isSecureNowInvestigationEffortAuditCandidate(inputs)) {
      return;
    }

    const handle = window.setTimeout(() => {
      void persistSecureNowInvestigationEffortInputsToAudit(inputs);
    }, 400);

    return () => {
      window.clearTimeout(handle);
    };
  }, [inputs, restoreComplete]);

  const resultState = useMemo(() => resolveSecureNowInvestigationEffortResultState(inputs), [inputs]);

  const updateInput = (field: keyof EffortInputs, value: string) => {
    inputEditsRef.current = { ...inputEditsRef.current, [field]: value };
    setInputs((current) => ({ ...current, [field]: value }));
  };

  return (
    <OperatorPageContainer
      variant="full"
      data-testid="securenow-investigation-effort-page"
    >
      <OperatorPageHeader
        title={SECURENOW_INVESTIGATION_EFFORT_HEADING}
        subtitle={SECURENOW_INVESTIGATION_EFFORT_LEAD}
      />

      <div className="mt-6 max-w-3xl space-y-6">
        {partialCapture ? (
          <div
            className="space-y-1 rounded border border-amber-500/30 bg-amber-50/30 p-3 dark:bg-amber-950/20"
            data-testid="securenow-investigation-effort-partial-capture"
          >
            <p className={OPERATOR_TYPOGRAPHY.helper}>{SECURENOW_INVESTIGATION_EFFORT_PARTIAL_CAPTURE_CONTEXT_LINE}</p>
            <p className={OPERATOR_TYPOGRAPHY.helper}>
              <SecureNowPartialCaptureRecoveryLinks
                partialCaptureSnapshotId={partialCaptureSnapshotId}
                returnPath={partialCaptureReturnPath}
                cloudConnectionsTestId="securenow-investigation-effort-partial-capture-cloud-connections"
                extractUploadTestId="securenow-investigation-effort-partial-capture-extract-upload"
              />
            </p>
          </div>
        ) : null}
        <SecureNowInvestigationEffortScopeLine />
        <p
          className={OPERATOR_TYPOGRAPHY.helper}
          data-testid="securenow-investigation-effort-operator-roi-discipline"
        >
          {SECURENOW_INVESTIGATION_EFFORT_OPERATOR_ROI_DISCIPLINE_LINE}
        </p>
        {resultState.kind === "incomplete" ? (
          <div
            className="rounded border border-amber-500/40 bg-amber-50/40 p-3 dark:bg-amber-950/20"
            role="status"
            data-testid="securenow-investigation-effort-blocking-banner"
          >
            <p className={OPERATOR_TYPOGRAPHY.body}>{formatSecureNowInvestigationEffortBlockingBanner(resultState.reason)}</p>
            <SecureNowInvestigationEffortMissingFieldLabelsLine inputs={inputs} />
          </div>
        ) : null}
        <section aria-labelledby="securenow-investigation-effort-inputs-heading" className="space-y-3">
          <h2 id="securenow-investigation-effort-inputs-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Entered inputs
          </h2>
          <p className={OPERATOR_TYPOGRAPHY.helper}>
            Enter comparable operator inputs. Fixture worksheet values are rejected.
          </p>
          <p
            className={OPERATOR_TYPOGRAPHY.helper}
            data-testid="securenow-investigation-effort-input-storage-discipline"
          >
            {SECURENOW_INVESTIGATION_EFFORT_INPUT_STORAGE_DISCIPLINE}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ["baselineHours", "Baseline hours (B)"],
              ["afterHours", "After-product hours (A)"],
              ["annualInvestigations", "Annual investigations (N)"],
              ["hourlyRate", "Fully loaded hourly rate (R)"],
              ["annualCost", "Annual product and operating cost (C)"],
            ] as const).map(([field, label]) => (
              <label key={field} className="space-y-1">
                <span className={OPERATOR_TYPOGRAPHY.helper}>{label}</span>
                <input
                  className="w-full rounded border border-border bg-background px-3 py-2"
                  type="number"
                  min="0"
                  step="any"
                  value={inputs[field]}
                  onChange={(event) => updateInput(field, event.target.value)}
                  aria-label={label}
                />
              </label>
            ))}
          </div>
          <div
            className="rounded border border-border bg-muted/30 p-3"
            data-testid="securenow-investigation-effort-result"
          >
            <p className={OPERATOR_TYPOGRAPHY.body}>{resultState.headline}</p>
            {resultState.kind === "incomplete" ? (
              <p
                className={OPERATOR_TYPOGRAPHY.helper}
                data-testid="securenow-investigation-effort-result-reason"
              >
                {resultState.reason}
              </p>
            ) : null}
            {resultState.kind === "calculated" ? (
              <ul className={OPERATOR_TYPOGRAPHY.helper}>
                <li>Gross annual analyst capacity value: {resultState.gross}</li>
                <li>Net annual value estimate: {resultState.net}</li>
                <li>ROI ratio: {resultState.ratio}</li>
              </ul>
            ) : null}
          </div>
        </section>

        <SecureNowInvestigationEffortSyntheticExamplePanel headingId="securenow-investigation-effort-synthetic-heading" />

        <section
          aria-labelledby="securenow-investigation-effort-notes-heading"
          className="space-y-2"
        >
          <h2
            id="securenow-investigation-effort-notes-heading"
            className={OPERATOR_TYPOGRAPHY.cardTitle}
          >
            Four notes
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            {SECURENOW_INVESTIGATION_EFFORT_NOTES.map((note) => (
              <li key={note.href} className={OPERATOR_TYPOGRAPHY.body}>
                <a className={OPERATOR_LINK.inline} href={note.href}>
                  {note.label}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <p className={OPERATOR_TYPOGRAPHY.body}>
          {SECURENOW_INVESTIGATION_EFFORT_GUARDRAIL}
        </p>
      </div>
    </OperatorPageContainer>
  );
}
