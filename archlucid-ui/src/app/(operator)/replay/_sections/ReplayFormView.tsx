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
      <p className="max-w-3xl leading-relaxed text-neutral-700 dark:text-neutral-300">
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
          <legend className="px-1 text-sm font-medium text-neutral-800 dark:text-neutral-200">Validation mode</legend>
          <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
            Pick the lightest mode that answers your question—heavier modes regenerate more stored output.
          </p>
          <select
            className="max-w-xl rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
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
        <p className="m-0 text-sm text-neutral-500 dark:text-neutral-400">{replayModeLabel(m.mode)}</p>

        <button
          type="button"
          className="w-fit rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 shadow-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
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
            <Link href="/reviews?projectId=default">Open review packages</Link>
          </p>
        </OperatorEmptyState>
      )}

      {m.loading && m.runIdTrimmed && (
        <OperatorLoadingNotice>
          <strong>Validation in progress.</strong>
          <p className="mt-2 text-sm">
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
            <h3 className="mt-0">Validation result</h3>
            <p className="mt-0 text-sm text-neutral-500 dark:text-neutral-400">
              Summary of what the API validated. Use notes below for follow-up.
            </p>
            <dl className="grid grid-cols-[220px_1fr] gap-x-4 gap-y-2 text-sm mb-5">
              <dt className="text-neutral-500 dark:text-neutral-400">Review package</dt>
              <dd className="m-0 font-mono text-[13px]">{m.result.runId}</dd>
              <dt className="text-neutral-500 dark:text-neutral-400">Validation mode</dt>
              <dd className="m-0 text-[13px]">{replayModeLabel(m.result.mode)}</dd>
              <dt className="text-neutral-500 dark:text-neutral-400">Validated (local)</dt>
              <dd className="m-0">{new Date(m.result.replayedUtc).toLocaleString()}</dd>
              {m.result.rebuiltManifestId && (
                <>
                  <dt className="text-neutral-500 dark:text-neutral-400">Rebuilt review record</dt>
                  <dd className="m-0 font-mono text-xs">{m.result.rebuiltManifestId}</dd>
                </>
              )}
              {m.result.rebuiltManifestHash && (
                <>
                  <dt className="text-neutral-500 dark:text-neutral-400">Rebuilt review record hash</dt>
                  <dd className="m-0 font-mono text-xs break-all">{m.result.rebuiltManifestHash}</dd>
                </>
              )}
              {m.result.rebuiltArtifactBundleId && (
                <>
                  <dt className="text-neutral-500 dark:text-neutral-400">Rebuilt artifact bundle</dt>
                  <dd className="m-0 font-mono text-xs">{m.result.rebuiltArtifactBundleId}</dd>
                </>
              )}
            </dl>

            <h4 className="text-[15px] mb-2">Validation flags</h4>
            <dl className="grid grid-cols-[240px_1fr] gap-x-3 gap-y-1.5 text-sm mb-5">
              <dt className="text-neutral-500 dark:text-neutral-400">Context present</dt>
              <dd className="m-0">{String(m.result.validation.contextPresent)}</dd>
              <dt className="text-neutral-500 dark:text-neutral-400">Graph present</dt>
              <dd className="m-0">{String(m.result.validation.graphPresent)}</dd>
              <dt className="text-neutral-500 dark:text-neutral-400">Findings present</dt>
              <dd className="m-0">{String(m.result.validation.findingsPresent)}</dd>
              <dt className="text-neutral-500 dark:text-neutral-400">Review record present</dt>
              <dd className="m-0">{String(m.result.validation.manifestPresent)}</dd>
              <dt className="text-neutral-500 dark:text-neutral-400">Trace present</dt>
              <dd className="m-0">{String(m.result.validation.tracePresent)}</dd>
              <dt className="text-neutral-500 dark:text-neutral-400">Artifacts present</dt>
              <dd className="m-0">{String(m.result.validation.artifactsPresent)}</dd>
              <dt className="text-neutral-500 dark:text-neutral-400">Review record hash matches</dt>
              <dd className="m-0">{String(m.result.validation.manifestHashMatches)}</dd>
              <dt className="text-neutral-500 dark:text-neutral-400">Artifact bundle after validation</dt>
              <dd className="m-0">{String(m.result.validation.artifactBundlePresentAfterReplay)}</dd>
            </dl>

            <h4 className="text-[15px] mb-2">Validation notes</h4>
            {m.result.validation.notes.length === 0 ? (
              <OperatorEmptyState title="No validation notes">
                <p className="m-0">Validation completed; the API returned zero note lines.</p>
              </OperatorEmptyState>
            ) : (
              <ul className="leading-relaxed m-0 pl-5">
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
