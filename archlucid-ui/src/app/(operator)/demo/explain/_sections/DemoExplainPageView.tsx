"use client";

import { cn } from "@/lib/utils";
import { DemoExplainConversionCtaCard } from "@/components/DemoExplainConversionCtaCard";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { DemoExplainEvidenceOrientationStrip } from "./DemoExplainEvidenceOrientationStrip";
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
    <>
      <div
        className="w-full max-w-[1440px] space-y-6 p-4 pb-28 md:pb-24"
        data-testid="demo-explain-page"
        aria-busy={state.loading}
      >
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-2">
            <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>
              Example analysis — provenance and explanation
            </h1>
            <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              Provenance graph and citations-bound explanation for the example architecture review.
            </p>
          </div>
          <PageContextualHelpButton />
        </div>
        {state.payload ? <DemoExplainStatusBanner payload={state.payload} /> : null}
      </header>

      <DemoExplainEvidenceOrientationStrip />

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
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} role="status">
          The demo response was incomplete — provenance or explanation is missing. Try again after the API is ready.
        </p>
      ) : null}
      </div>

      {state.payload && state.payload.provenanceGraph && state.payload.runExplanation ? (
        <DemoExplainConversionCtaCard />
      ) : null}
    </>
  );
}
