import type { CitationReference, RunExplanationSummary } from "@/types/explanation";
import { isDeterministicExplanationFallback } from "@/types/explanation";
import { ExplanationEvidenceBasisBadges } from "@/components/ExplanationEvidenceBasisBadges";

type Props = {
  readonly summary: RunExplanationSummary;
};

export function DemoExplainExplanationPanel(props: Props) {
  const summary = props.summary;
  const themes = summary.themeSummaries ?? [];
  const citations: ReadonlyArray<CitationReference> = summary.citations ?? [];

  return (
    <section
      aria-labelledby="demo-explain-explanation-heading"
      data-testid="demo-explain-run-explanation"
      className="space-y-3 rounded border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
    >
      <header className="space-y-1">
        <h2
          id="demo-explain-explanation-heading"
          className="text-sm font-semibold text-al-text-primary"
        >
          Aggregate explanation &amp; citations
        </h2>
        <p className="text-xs text-neutral-500">
          {summary.findingCount} findings · {summary.decisionCount} decisions ·{" "}
          {citations.length} citations
        </p>
        <ExplanationEvidenceBasisBadges
          citationCount={citations.length}
          faithfulnessSupportRatio={summary.faithfulnessSupportRatio}
          deterministicFallbackUsed={isDeterministicExplanationFallback(summary)}
          demoDerived
        />
      </header>

      <div className="rounded border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Overall assessment</h3>
        <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
          {summary.overallAssessment || "(no overall assessment recorded)"}
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          Risk posture: <code>{summary.riskPosture || "unknown"}</code>
          {isDeterministicExplanationFallback(summary) ? " · deterministic fallback in use" : ""}
        </p>
      </div>

      {themes.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Themes</h3>
          <ul className="mt-1 list-disc pl-5 text-sm text-neutral-700 dark:text-neutral-300">
            {themes.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div data-testid="demo-explain-citations">
        <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Citations ({citations.length})
        </h3>
        {citations.length === 0 ? (
          <p className="mt-1 text-sm text-neutral-500">
            No citations were emitted for this review — explanations on this page are unsupported.
          </p>
        ) : (
          <ul className="mt-1 space-y-1 text-sm text-neutral-700 dark:text-neutral-300">
            {citations.map((c) => (
              <li key={`${c.kind}:${c.id}`} className="font-mono text-xs">
                <span className="rounded bg-neutral-100 px-1 py-0.5 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                  {c.kind}
                </span>{" "}
                <span>{c.label}</span> <span className="text-neutral-500">({c.id})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
