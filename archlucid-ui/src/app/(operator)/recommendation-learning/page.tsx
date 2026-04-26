"use client";

import { useState } from "react";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { getLatestLearningProfile, rebuildLearningProfile } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { LearningProfile } from "@/types/recommendation-learning";

export default function RecommendationLearningPage() {
  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);

  async function loadLatest() {
    setLoading(true);
    setFailure(null);
    try {
      const data = await getLatestLearningProfile();
      setProfile(data);
    } catch (e) {
      setFailure(toApiLoadFailure(e));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  async function rebuild() {
    setLoading(true);
    setFailure(null);
    try {
      const data = await rebuildLearningProfile();
      setProfile(data);
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-4xl">
      <h2 className="mt-0">Recommendation learning</h2>
      <p className="text-neutral-600 dark:text-neutral-400 text-sm">
        Inspect adaptive weights derived from historical recommendation outcomes (category, urgency, inferred signal type).
        Rebuild analyzes up to 5000 records in the current scope and stores a new profile snapshot.
      </p>

      <div className="flex gap-3 mb-6 flex-wrap">
        <button type="button" onClick={() => void loadLatest()} disabled={loading}>
          Load latest profile
        </button>
        <button type="button" onClick={() => void rebuild()} disabled={loading}>
          Rebuild profile
        </button>
      </div>

      {failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={failure.message}
            correlationId={failure.correlationId}
          />
        </div>
      ) : null}

      {profile ? (
        <>
          <h3>Summary notes</h3>
          <ul>
            {profile.notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
          <p className="text-neutral-500 dark:text-neutral-400 text-[13px]">
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
      ) : !loading && failure === null ? (
        <p className="text-neutral-500 dark:text-neutral-400">No profile loaded. Use the buttons above.</p>
      ) : null}
    </main>
  );
}
