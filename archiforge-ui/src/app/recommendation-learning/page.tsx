"use client";

import { useState } from "react";
import { getLatestLearningProfile, rebuildLearningProfile } from "@/lib/api";
import type { LearningProfile } from "@/types/recommendation-learning";

export default function RecommendationLearningPage() {
  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadLatest() {
    setLoading(true);
    setError(null);
    try {
      const data = await getLatestLearningProfile();
      setProfile(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  async function rebuild() {
    setLoading(true);
    setError(null);
    try {
      const data = await rebuildLearningProfile();
      setProfile(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rebuild failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 900 }}>
      <h2 style={{ marginTop: 0 }}>Recommendation learning</h2>
      <p style={{ color: "#444", fontSize: 14 }}>
        Inspect adaptive weights derived from historical recommendation outcomes (category, urgency, inferred signal type).
        Rebuild analyzes up to 5000 records in the current scope and stores a new profile snapshot.
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <button type="button" onClick={() => void loadLatest()} disabled={loading}>
          Load latest profile
        </button>
        <button type="button" onClick={() => void rebuild()} disabled={loading}>
          Rebuild profile
        </button>
      </div>

      {error ? (
        <p style={{ color: "crimson" }} role="alert">
          {error}
        </p>
      ) : null}

      {profile ? (
        <>
          <h3>Summary notes</h3>
          <ul>
            {profile.notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
          <p style={{ color: "#666", fontSize: 13 }}>
            Generated: {new Date(profile.generatedUtc).toLocaleString()}
          </p>

          <h3>Category weights</h3>
          <ul>
            {Object.entries(profile.categoryWeights).map(([key, value]) => (
              <li key={key}>
                {key}: {value.toFixed(2)}
              </li>
            ))}
          </ul>

          <h3>Urgency weights</h3>
          <ul>
            {Object.entries(profile.urgencyWeights).map(([key, value]) => (
              <li key={key}>
                {key}: {value.toFixed(2)}
              </li>
            ))}
          </ul>

          <h3>Signal type weights</h3>
          <ul>
            {Object.entries(profile.signalTypeWeights).map(([key, value]) => (
              <li key={key}>
                {key}: {value.toFixed(2)}
              </li>
            ))}
          </ul>
        </>
      ) : !loading && !error ? (
        <p style={{ color: "#666" }}>No profile loaded. Use the buttons above.</p>
      ) : null}
    </main>
  );
}
