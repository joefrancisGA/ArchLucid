"use client";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";

import { DemoExplainExplanationPanel } from "./DemoExplainExplanationPanel";
import { DemoExplainNotAvailableNotice } from "./DemoExplainNotAvailableNotice";
import { DemoExplainProvenanceGraphPanel } from "./DemoExplainProvenanceGraphPanel";
import { DemoExplainStatusBanner } from "./DemoExplainStatusBanner";
import type { DemoExplainPageState } from "./demo-explain-page-types";

type Props = {
  readonly state: DemoExplainPageState;
};

export function DemoExplainPageView(props: Props) {
  const state = props.state;

  return (
    <div
      className="mx-auto max-w-6xl space-y-6 p-4"
      data-testid="demo-explain-page"
      aria-busy={state.loading}
    >
      <header className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-al-text-primary">
          Example analysis — provenance and explanation
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Provenance graph and citations-bound explanation for the example architecture review.
        </p>
        {state.payload ? <DemoExplainStatusBanner payload={state.payload} /> : null}
      </header>

      {state.error ? (
        <OperatorApiProblem
          problem={state.error.problem}
          fallbackMessage={state.error.message}
          correlationId={state.error.correlationId}
        />
      ) : null}

      {state.notFound ? <DemoExplainNotAvailableNotice /> : null}

      {state.payload && state.payload.provenanceGraph && state.payload.runExplanation ? (
        <section aria-label="Provenance and explanation" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DemoExplainProvenanceGraphPanel graph={state.payload.provenanceGraph} />
          <DemoExplainExplanationPanel summary={state.payload.runExplanation} />
        </section>
      ) : !state.error && !state.notFound && state.loading ? (
        <OperatorLoadingNotice>Loading example analysis…</OperatorLoadingNotice>
      ) : !state.error && !state.notFound && !state.loading && state.payload ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-400" role="status">
          The demo response was incomplete — provenance or explanation is missing. Try again after the API is ready.
        </p>
      ) : null}
    </div>
  );
}
