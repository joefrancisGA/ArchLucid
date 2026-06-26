"use client";

import Link from "next/link";

import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import {
  OperatorEmptyState,
  OperatorLoadingNotice,
  OperatorMalformedCallout,
  OperatorTryNext,
} from "@/components/OperatorShellMessage";
import { RunIdPicker } from "@/components/RunIdPicker";
import {
  replayModeLabel,
  replayModeShortLabel,
  replayValidationActionLabel,
  REPLAY_MODE_PLAIN_OPTIONS,
  sortReplayNotes,
} from "@/lib/replay-display";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import type { ReplayFormViewModel } from "./replay-form-view-model";

type Props = {
  readonly model: ReplayFormViewModel;
};

export function ReplayFormView(props: Props) {
  const m = props.model;
  const validateOnlyLabel = replayModeShortLabel("ReconstructOnly");
  const regenerateArtifactsLabel = replayModeShortLabel("RebuildArtifacts");

  return (
    <div>
      <LayerHeader pageKey="replay" density="compact" />
      <OperatorPageHeader title="Validate review package" helpKey="replay-run" />
      <p className={cn("max-w-3xl leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        Check whether a finalized review package can still be reproduced and whether its evidence links, findings, decisions, and signed
        review record remain valid.
      </p>

      <div className="grid max-w-3xl gap-3">
        <RunIdPicker
          label="Review package"
          placeholder="Choose or enter review package"
          value={m.runId}
          onChange={m.setRunId}
          inputId="replay-run-id"
        />

        <fieldset className="max-w-3xl space-y-2 rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40">
          <legend className={cn("px-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Validation mode</legend>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Pick the lightest mode that answers your question—heavier modes regenerate more stored output.
          </p>
          <select
            className={cn(
              "max-w-xl rounded-md border border-neutral-300 bg-white px-3 py-2 text-al-text-primary dark:border-neutral-600 dark:bg-neutral-900",
              OPERATOR_TYPOGRAPHY.body,
            )}
            value={m.mode}
            onChange={(e) => m.setMode(e.target.value)}
            aria-label="Validation mode"
          >
            {REPLAY_MODE_PLAIN_OPTIONS.map((row) => (
              <option key={row.mode} value={row.mode} title={replayModeLabel(row.mode)}>
                {row.label}
              </option>
            ))}
          </select>
        </fieldset>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{replayModeLabel(m.mode)}</p>

        <button
          type="button"
          className={cn(
            "w-fit rounded-md border border-neutral-300 bg-white px-4 py-2.5 font-medium text-al-text-primary shadow-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900 dark:hover:bg-neutral-800",
            OPERATOR_TYPOGRAPHY.button,
          )}
          onClick={() => void m.onReplay()}
          disabled={m.loading || !m.runIdTrimmed}
        >
          {replayValidationActionLabel(m.mode, m.loading)}
        </button>
      </div>

      {!m.runIdTrimmed && (
        <OperatorEmptyState title="No review selected">
          <p className="m-0">
            Open this page from a review package, or choose a finalized review package to validate.
          </p>
          <p className="m-0 mt-2">
            <Link className={OPERATOR_LINK.nav} href="/reviews?projectId=default">Open review packages</Link>
          </p>
        </OperatorEmptyState>
      )}

      {m.loading && m.runIdTrimmed && (
        <OperatorLoadingNotice>
          <strong>Validation in progress.</strong>
          <p className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>
            Waiting for the API to finish validating stored review output. Heavier validation modes can take longer—avoid navigating away
            until this clears.
          </p>
        </OperatorLoadingNotice>
      )}

      {m.failure !== null && (
        <>
          <OperatorApiProblem failure={m.failure} />
          <OperatorTryNext>
            Confirm the review exists, you have operator permissions, and the API is healthy. Retry with a lighter mode (e.g.{" "}
            <strong>{validateOnlyLabel}</strong>) before <strong>{regenerateArtifactsLabel}</strong>. Copy the correlation ID for support
            logs.
          </OperatorTryNext>
        </>
      )}

      {m.malformedMessage && (
        <>
          <OperatorMalformedCallout>
            <strong>Validation response was not usable.</strong>
            <p className="mt-2">{m.malformedMessage}</p>
          </OperatorMalformedCallout>
          <OperatorTryNext>
            Compare API and UI versions. If HTTP succeeded but validation JSON drifted, open a defect with the product version and the
            correlation ID from any paired failing request.
          </OperatorTryNext>
        </>
      )}

      {m.result && (
        <ClientErrorBoundary title="Validation result failed to render">
          <section className="mt-6 max-w-3xl rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950">
            <h3 className={cn("mt-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>Validation result</h3>
            <p className={cn("mt-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Summary of what the API validated. Use notes below for follow-up.
            </p>
            <dl className={cn("mb-5 grid grid-cols-[220px_1fr] gap-x-4 gap-y-2", OPERATOR_TYPOGRAPHY.body)}>
              <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Review package</dt>
              <dd className={cn("m-0 font-mono", OPERATOR_TYPOGRAPHY.body)}>{m.result.runId}</dd>
              <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Validation mode</dt>
              <dd className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{replayModeLabel(m.result.mode)}</dd>
              <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Validated (local)</dt>
              <dd className="m-0">{new Date(m.result.replayedUtc).toLocaleString()}</dd>
              {m.result.rebuiltManifestId && (
                <>
                  <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Rebuilt review record</dt>
                  <dd className={cn("m-0 font-mono", OPERATOR_TYPOGRAPHY.micro)}>{m.result.rebuiltManifestId}</dd>
                </>
              )}
              {m.result.rebuiltManifestHash && (
                <>
                  <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Rebuilt review record hash</dt>
                  <dd className={cn("m-0 break-all font-mono", OPERATOR_TYPOGRAPHY.micro)}>{m.result.rebuiltManifestHash}</dd>
                </>
              )}
              {m.result.rebuiltArtifactBundleId && (
                <>
                  <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Rebuilt artifact bundle</dt>
                  <dd className={cn("m-0 font-mono", OPERATOR_TYPOGRAPHY.micro)}>{m.result.rebuiltArtifactBundleId}</dd>
                </>
              )}
            </dl>

            <h4 className={cn("mb-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Validation flags</h4>
            <dl className={cn("mb-5 grid grid-cols-[240px_1fr] gap-x-3 gap-y-1.5", OPERATOR_TYPOGRAPHY.body)}>
              <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Context present</dt>
              <dd className="m-0">{String(m.result.validation.contextPresent)}</dd>
              <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Graph present</dt>
              <dd className="m-0">{String(m.result.validation.graphPresent)}</dd>
              <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Findings present</dt>
              <dd className="m-0">{String(m.result.validation.findingsPresent)}</dd>
              <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Review record present</dt>
              <dd className="m-0">{String(m.result.validation.manifestPresent)}</dd>
              <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Trace present</dt>
              <dd className="m-0">{String(m.result.validation.tracePresent)}</dd>
              <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Artifacts present</dt>
              <dd className="m-0">{String(m.result.validation.artifactsPresent)}</dd>
              <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Review record hash matches</dt>
              <dd className="m-0">{String(m.result.validation.manifestHashMatches)}</dd>
              <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Artifact bundle after validation</dt>
              <dd className="m-0">{String(m.result.validation.artifactBundlePresentAfterReplay)}</dd>
            </dl>

            <h4 className={cn("mb-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Validation notes</h4>
            {m.result.validation.notes.length === 0 ? (
              <OperatorEmptyState title="No validation notes">
                <p className="m-0">Validation completed; the API returned zero note lines.</p>
              </OperatorEmptyState>
            ) : (
              <ul className={cn("m-0 pl-5 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>
                {sortReplayNotes(m.result.validation.notes).map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            )}
          </section>
        </ClientErrorBoundary>
      )}
    </div>
  );
}
