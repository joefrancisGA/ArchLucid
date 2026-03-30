"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  OperatorEmptyState,
  OperatorErrorCallout,
  OperatorLoadingNotice,
  OperatorMalformedCallout,
} from "@/components/OperatorShellMessage";
import { coerceReplayResponse } from "@/lib/operator-response-guards";
import { replayRun } from "@/lib/api";
import type { ReplayResponse } from "@/types/authority";

/** Matches ArchiForge.Persistence.Replay.ReplayMode */
const replayModes = ["ReconstructOnly", "RebuildManifest", "RebuildArtifacts"] as const;

function ReplayForm() {
  const searchParams = useSearchParams();
  const [runId, setRunId] = useState("");
  const [mode, setMode] = useState<string>(replayModes[0]);
  const [result, setResult] = useState<ReplayResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [malformedMessage, setMalformedMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const r = searchParams.get("runId");
    if (r) setRunId(r);
  }, [searchParams]);

  async function onReplay() {
    setLoading(true);
    setError(null);
    setMalformedMessage(null);

    try {
      const response: unknown = await replayRun(runId, mode);
      const coerced = coerceReplayResponse(response);

      if (!coerced.ok) {
        setResult(null);
        setMalformedMessage(coerced.message);
      } else {
        setResult(coerced.value);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Replay failed.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h2>Replay run</h2>

      <div style={{ display: "grid", gap: 12, maxWidth: 800 }}>
        <input value={runId} onChange={(e) => setRunId(e.target.value)} placeholder="Run ID" />

        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          {replayModes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => void onReplay()}
          disabled={loading || !runId}
        >
          {loading ? "Replaying…" : "Replay"}
        </button>
      </div>

      {!runId && (
        <OperatorEmptyState title="Waiting for a run ID">
          <p style={{ margin: 0 }}>
            Enter the run to replay, or open this page with <code>?runId=…</code> in the URL.
          </p>
        </OperatorEmptyState>
      )}

      {loading && runId && (
        <OperatorLoadingNotice>
          <strong>Replay in progress.</strong>
          <p style={{ margin: "8px 0 0", fontSize: 14 }}>Waiting for the API to finish the replay…</p>
        </OperatorLoadingNotice>
      )}

      {error && (
        <OperatorErrorCallout>
          <strong>Replay request failed.</strong>
          <p style={{ margin: "8px 0 0" }}>{error}</p>
        </OperatorErrorCallout>
      )}

      {malformedMessage && (
        <OperatorMalformedCallout>
          <strong>Replay response was not usable.</strong>
          <p style={{ margin: "8px 0 0" }}>{malformedMessage}</p>
        </OperatorMalformedCallout>
      )}

      {result && (
        <section style={{ marginTop: 24 }}>
          <h3>Replay result</h3>
          <p>
            <strong>Run ID:</strong> {result.runId}
          </p>
          <p>
            <strong>Mode:</strong> {result.mode}
          </p>
          <p>
            <strong>Replayed:</strong> {new Date(result.replayedUtc).toLocaleString()}
          </p>
          <p>
            <strong>Manifest hash matches:</strong> {String(result.validation.manifestHashMatches)}
          </p>
          <p>
            <strong>Artifacts present after replay:</strong>{" "}
            {String(result.validation.artifactBundlePresentAfterReplay)}
          </p>

          <h4>Validation notes</h4>
          {result.validation.notes.length === 0 ? (
            <OperatorEmptyState title="No validation notes">
              <p style={{ margin: 0 }}>The replay completed; the API returned zero note lines.</p>
            </OperatorEmptyState>
          ) : (
            <ul>
              {result.validation.notes.map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}

function ReplaySuspenseFallback() {
  return (
    <main>
      <OperatorLoadingNotice>
        <strong>Loading replay.</strong>
        <p style={{ margin: "8px 0 0", fontSize: 14 }}>Reading URL parameters for this page…</p>
      </OperatorLoadingNotice>
    </main>
  );
}

export default function ReplayPage() {
  return (
    <Suspense fallback={<ReplaySuspenseFallback />}>
      <ReplayForm />
    </Suspense>
  );
}
