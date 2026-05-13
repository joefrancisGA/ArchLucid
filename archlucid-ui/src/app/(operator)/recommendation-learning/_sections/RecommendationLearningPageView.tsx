"use client";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";

import type { RecommendationLearningPageViewModel } from "./recommendation-learning-page-view-model";

type Props = {
  readonly model: RecommendationLearningPageViewModel;
};

export function RecommendationLearningPageView(props: Props) {
  const m = props.model;

  if (m.demoMode) {
    return (
      <div className="max-w-4xl">
        <OperatorLoadingNotice>Returning to home…</OperatorLoadingNotice>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h2 className="mt-0">Recommendation tuning</h2>
      <p className="text-neutral-600 dark:text-neutral-400 text-sm">
        Inspect adaptive weights derived from historical recommendation outcomes (category, urgency, inferred signal type).
        Rebuild analyzes up to 5000 records in the current scope and stores a new profile snapshot.
      </p>

      <div className="flex gap-3 mb-6 flex-wrap">
        <button type="button" onClick={() => void m.loadLatest()} disabled={m.loading}>
          Load latest profile
        </button>
        <button type="button" onClick={() => void m.rebuild()} disabled={m.loading}>
          Rebuild profile
        </button>
      </div>

      {m.failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={m.failure.problem}
            fallbackMessage={m.failure.message}
            correlationId={m.failure.correlationId}
          />
        </div>
      ) : null}

      {m.profile ? (
        <>
          <h3>Summary notes</h3>
          <ul>
            {m.profile.notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
          <p className="text-neutral-500 dark:text-neutral-400 text-[13px]">
            Generated: {new Date(m.profile.generatedUtc).toLocaleString()}
          </p>

          <h3>Category weights</h3>
          <ul>
            {Object.entries(m.profile.categoryWeights).map(([key, value]) => (
              <li key={key}>
                {key}: {value.toFixed(2)}
              </li>
            ))}
          </ul>

          <h3>Urgency weights</h3>
          <ul>
            {Object.entries(m.profile.urgencyWeights).map(([key, value]) => (
              <li key={key}>
                {key}: {value.toFixed(2)}
              </li>
            ))}
          </ul>

          <h3>Signal type weights</h3>
          <ul>
            {Object.entries(m.profile.signalTypeWeights).map(([key, value]) => (
              <li key={key}>
                {key}: {value.toFixed(2)}
              </li>
            ))}
          </ul>
        </>
      ) : !m.loading && m.failure === null ? (
        <p className="text-neutral-500 dark:text-neutral-400">No profile loaded. Use the buttons above.</p>
      ) : null}
    </div>
  );
}
