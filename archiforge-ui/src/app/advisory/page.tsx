"use client";

import { useState } from "react";
import { getImprovementPlan } from "@/lib/api";
import type { ImprovementPlan } from "@/types/advisory";

export default function AdvisoryPage() {
  const [runId, setRunId] = useState("");
  const [compareToRunId, setCompareToRunId] = useState("");
  const [result, setResult] = useState<ImprovementPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadAdvice() {
    const rid = runId.trim();
    if (!rid) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getImprovementPlan(rid, compareToRunId.trim() || undefined);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 900 }}>
      <h2 style={{ marginTop: 0 }}>Improvement Advisor</h2>
      <p style={{ color: "#444", fontSize: 14 }}>
        Ranked recommendations from manifest gaps, issues, cost risks, and optional comparison to a prior run.
      </p>

      <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
        <input
          value={runId}
          onChange={(e) => setRunId(e.target.value)}
          placeholder="Run ID (target / current run)"
          style={{ padding: 8, fontFamily: "monospace" }}
        />
        <input
          value={compareToRunId}
          onChange={(e) => setCompareToRunId(e.target.value)}
          placeholder="Optional compare-to run ID (base run for delta signals)"
          style={{ padding: 8, fontFamily: "monospace" }}
        />
        <button type="button" onClick={() => void loadAdvice()} disabled={loading || !runId.trim()}>
          {loading ? "Analyzing…" : "Generate recommendations"}
        </button>
      </div>

      {error ? (
        <p style={{ color: "crimson" }} role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <>
          <h3>Summary</h3>
          <ul>
            {result.summaryNotes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>

          <h3>Recommendations</h3>
          <div style={{ display: "grid", gap: 16 }}>
            {result.recommendations.map((rec) => (
              <div
                key={rec.recommendationId}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: 16,
                  background: "#fff",
                }}
              >
                <h4 style={{ marginTop: 0 }}>{rec.title}</h4>
                <p>
                  <strong>Category:</strong> {rec.category}
                </p>
                <p>
                  <strong>Urgency:</strong> {rec.urgency}
                </p>
                <p>
                  <strong>Priority score:</strong> {rec.priorityScore}
                </p>
                <p>
                  <strong>Rationale:</strong> {rec.rationale}
                </p>
                <p>
                  <strong>Suggested action:</strong> {rec.suggestedAction}
                </p>
                <p style={{ marginBottom: 0 }}>
                  <strong>Expected impact:</strong> {rec.expectedImpact}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </main>
  );
}
