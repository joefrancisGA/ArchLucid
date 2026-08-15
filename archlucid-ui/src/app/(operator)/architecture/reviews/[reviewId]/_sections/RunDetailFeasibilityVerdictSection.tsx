import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { DecisionReceiptExportButton } from "@/components/draft-intake/DecisionReceiptExportButton";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { isExportableDecisionVerdict } from "@/lib/decision-receipt-export";
import {
  filterFeasibilityTransparencyTrailInferred,
  parseFeasibilityVerdictDrivers,
  type FeasibilityVerdictDriver,
  type FeasibilityVerdictDriverKind,
} from "@/lib/feasibility-verdict-transparency-trail";
import {
  feasibilityVerdictKindLabel,
  feasibilityVerdictTone,
} from "@/lib/feasibility-verdict-display";
import { graphFindingDetailHref } from "@/lib/graph-finding-deep-links";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { runDetailSectionHeadingClass } from "./run-detail-section-heading";

type RunDetailFeasibilityVerdictSectionProps = {
  readonly verdict: ManifestFeasibilityVerdict;
  readonly runId: string;
};

function toneClassName(tone: "success" | "warning" | "danger"): string {
  if (tone === "success") {
    return "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100";
  }

  if (tone === "danger") {
    return "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100";
  }

  return "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100";
}

function driverKindLabel(kind: FeasibilityVerdictDriverKind): string {
  switch (kind) {
    case "blocking-finding":
      return "Blocking finding severity";

    case "policy-violation":
      return "Policy violation";

    case "manifest-issue":
      return "Unresolved manifest issue";

    case "uncovered-requirement":
      return "Uncovered requirement";

    default:
      return "Driver";
  }
}

function FeasibilityVerdictDriverRow(props: {
  readonly driver: FeasibilityVerdictDriver;
  readonly reviewId: string;
}): ReactElement {
  const { driver, reviewId } = props;

  if (driver.kind === "blocking-finding" && driver.findingId !== undefined) {
    return (
      <li>
        <Link
          href={graphFindingDetailHref(reviewId, driver.findingId)}
          className="text-al-accent-link underline-offset-2 hover:underline"
        >
          {driver.label}
        </Link>
      </li>
    );
  }

  return <li>{driver.label}</li>;
}

export function RunDetailFeasibilityVerdictSection(
  props: RunDetailFeasibilityVerdictSectionProps,
): ReactElement {
  const { verdict } = props;
  const reviewId = props.runId.trim();
  const tone = feasibilityVerdictTone(verdict.kind);
  const trail = verdict.transparencyTrail;
  const verdictDrivers = parseFeasibilityVerdictDrivers(trail);
  const inferredTrailEntries =
    trail !== undefined ? filterFeasibilityTransparencyTrailInferred(trail) : [];

  return (
    <section id="feasibility-verdict" className="scroll-mt-24" data-testid="run-detail-feasibility-verdict">
      <div className={`rounded-lg border p-4 ${toneClassName(tone)}`}>
        <h4 className={`${runDetailSectionHeadingClass} mb-2`}>Feasibility verdict</h4>
        <p className={cn("m-0 font-semibold", OPERATOR_TYPOGRAPHY.body)}>{feasibilityVerdictKindLabel(verdict.kind)}</p>
        <p className={cn("mt-2 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>{verdict.summary}</p>

        {verdictDrivers.length > 0 ? (
          <div
            className={cn("mt-4 space-y-3", OPERATOR_TYPOGRAPHY.body)}
            data-testid="feasibility-verdict-drivers"
          >
            <p className="m-0 font-medium">What drove this verdict</p>
            {verdictDrivers.map((driver) => (
              <div key={driver.key}>
                <p className="m-0 text-al-text-secondary">{driverKindLabel(driver.kind)}</p>
                <ul className="mt-1 list-disc pl-5">
                  <FeasibilityVerdictDriverRow driver={driver} reviewId={reviewId} />
                </ul>
              </div>
            ))}
          </div>
        ) : null}

        {verdict.softEnvelope !== undefined && verdict.softEnvelope !== null ? (
          <dl className={cn("mt-4 grid gap-2 sm:grid-cols-[minmax(8rem,auto)_1fr] sm:gap-x-4", OPERATOR_TYPOGRAPHY.body)}>
            <dt className="font-medium">Confidence band</dt>
            <dd className="m-0 tabular-nums">
              {verdict.softEnvelope.confidenceLow}–{verdict.softEnvelope.confidenceHigh}
            </dd>
            <dt className="font-medium">Envelope</dt>
            <dd className="m-0">{verdict.softEnvelope.envelopeDescription}</dd>
            <dt className="font-medium">Soft assumption</dt>
            <dd className="m-0">{verdict.softEnvelope.softAssumption}</dd>
          </dl>
        ) : null}

        {verdict.unsatCoreInvariantKeys !== undefined && verdict.unsatCoreInvariantKeys.length > 0 ? (
          <p className={cn("mt-3", OPERATOR_TYPOGRAPHY.body)}>
            Unsat core: {verdict.unsatCoreInvariantKeys.join(", ")}
          </p>
        ) : null}

        {isExportableDecisionVerdict(verdict.kind) ? (
          <div className="mt-4">
            <DecisionReceiptExportButton
              context={{
                source: "committed-run",
                runId: props.runId,
                verdict,
              }}
            />
          </div>
        ) : null}
      </div>

      {trail !== undefined ? (
        <CollapsibleSection title="Transparency trail" defaultOpen={false}>
          <div className={cn("space-y-4", OPERATOR_TYPOGRAPHY.body)}>
            {trail.asserted.length > 0 ? (
              <div>
                <p className="m-0 font-medium">Asserted ({trail.asserted.length})</p>
                <ul className="mt-1 list-disc pl-5">
                  {trail.asserted.map((entry) => (
                    <li key={entry.key}>
                      {entry.key}: {entry.value}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {inferredTrailEntries.length > 0 ? (
              <div>
                <p className="m-0 font-medium">Inferred ({inferredTrailEntries.length})</p>
                <ul className="mt-1 list-disc pl-5">
                  {inferredTrailEntries.map((entry) => (
                    <li key={entry.key}>
                      {entry.key}: {entry.value} (confidence {entry.confidence})
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {trail.skipped.length > 0 ? (
              <div>
                <p className="m-0 font-medium">Skipped ({trail.skipped.length})</p>
                <ul className="mt-1 list-disc pl-5">
                  {trail.skipped.map((entry) => (
                    <li key={entry.questionKey}>
                      {entry.questionKey} ({entry.tier})
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </CollapsibleSection>
      ) : null}
    </section>
  );
}
