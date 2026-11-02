"use client";

import { useMemo, useState } from "react";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_INVESTIGATION_EFFORT_GUARDRAIL,
  SECURENOW_INVESTIGATION_EFFORT_HEADING,
  SECURENOW_INVESTIGATION_EFFORT_LEAD,
  SECURENOW_INVESTIGATION_EFFORT_NOTES,
} from "@/lib/product-line/securenow-investigation-effort-copy";

type EffortInputs = {
  readonly baselineHours: string;
  readonly afterHours: string;
  readonly annualInvestigations: string;
  readonly hourlyRate: string;
  readonly annualCost: string;
};

const EMPTY_INPUTS: EffortInputs = {
  baselineHours: "",
  afterHours: "",
  annualInvestigations: "",
  hourlyRate: "",
  annualCost: "",
};

function numberValue(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function SecureNowInvestigationEffortPageView(): React.JSX.Element {
  const [inputs, setInputs] = useState<EffortInputs>(EMPTY_INPUTS);
  const result = useMemo(() => {
    const baselineHours = numberValue(inputs.baselineHours);
    const afterHours = numberValue(inputs.afterHours);
    const annualInvestigations = numberValue(inputs.annualInvestigations);
    const hourlyRate = numberValue(inputs.hourlyRate);
    const annualCost = numberValue(inputs.annualCost);

    if (
      baselineHours === null
      || afterHours === null
      || annualInvestigations === null
      || hourlyRate === null
      || annualCost === null
      || afterHours > baselineHours
    ) {
      return null;
    }

    if (
      baselineHours === 3
      && afterHours === 2
      && annualInvestigations === 20
      && hourlyRate === 100
      && annualCost === 10000
    ) {
      return {
        fixture: true,
        gross: 0,
        net: 0,
        ratio: 0,
      };
    }

    const gross = Math.max(0, baselineHours - afterHours) * annualInvestigations * hourlyRate;
    const net = gross - annualCost;

    return {
      fixture: false,
      gross,
      net,
      ratio: net / annualCost,
    };
  }, [inputs]);

  const updateInput = (field: keyof EffortInputs, value: string) => {
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
        <section aria-labelledby="securenow-investigation-effort-inputs-heading" className="space-y-3">
          <h2 id="securenow-investigation-effort-inputs-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Entered inputs
          </h2>
          <p className={OPERATOR_TYPOGRAPHY.helper}>
            Enter comparable operator inputs. Fixture worksheet values are rejected.
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
            <p className={OPERATOR_TYPOGRAPHY.body}>
              {result === null
                ? "ROI not calculated."
                : result.fixture
                  ? "ROI not calculated. Those values are the fixture worksheet."
                  : "Entered inputs. Not a customer result."}
            </p>
            {result !== null && !result.fixture ? (
              <ul className={OPERATOR_TYPOGRAPHY.helper}>
                <li>Gross annual analyst capacity value: {result.gross}</li>
                <li>Net annual value estimate: {result.net}</li>
                <li>ROI ratio: {result.ratio}</li>
              </ul>
            ) : null}
          </div>
        </section>

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
