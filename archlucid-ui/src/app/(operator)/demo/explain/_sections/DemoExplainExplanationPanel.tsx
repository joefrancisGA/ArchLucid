import { cn } from "@/lib/utils";
import type { CitationReference, RunExplanationSummary } from "@/types/explanation";
import { isDeterministicExplanationFallback } from "@/types/explanation";
import { ExplanationEvidenceBasisBadges } from "@/components/ExplanationEvidenceBasisBadges";
import { citationKindBuyerLabel } from "@/lib/citation-kind-buyer-label";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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
          className={OPERATOR_TYPOGRAPHY.cardTitle}
        >
          Aggregate explanation &amp; citations
        </h2>
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
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
        <h3 className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Overall assessment</h3>
        <p className={cn("mt-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {summary.overallAssessment || "(no overall assessment recorded)"}
        </p>
        <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Risk posture: <code>{summary.riskPosture || "unknown"}</code>
          {isDeterministicExplanationFallback(summary) ? " · deterministic fallback in use" : ""}
        </p>
      </div>

      {themes.length > 0 ? (
        <div>
          <h3 className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Themes</h3>
          <ul className={cn("mt-1 list-disc pl-5 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {themes.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div data-testid="demo-explain-citations">
        <h3 className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Citations ({citations.length})
        </h3>
        {citations.length === 0 ? (
          <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            No citations were emitted for this review — explanations on this page are unsupported.
          </p>
        ) : (
          <ul className={cn("mt-1 space-y-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {citations.map((c) => (
              <li key={`${c.kind}:${c.id}`} className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>
                <span className={cn("rounded bg-neutral-100 px-1 py-0.5 text-al-text-primary dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.badge)}>
                  {citationKindBuyerLabel(c.kind)}
                </span>{" "}
                <span>{c.label}</span> <span className="text-al-text-secondary">({c.id})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
