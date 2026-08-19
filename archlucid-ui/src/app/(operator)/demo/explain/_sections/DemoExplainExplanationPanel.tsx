import { cn } from "@/lib/utils";
import type { CitationReference, RunExplanationSummary } from "@/types/explanation";
import { isDeterministicExplanationFallback } from "@/types/explanation";
import { citationKindBuyerLabel } from "@/lib/citation-kind-buyer-label";
import {
  DEMO_EXPLAIN_DETERMINISTIC_FALLBACK_NOTE,
  DEMO_EXPLAIN_EXPLANATION_PANEL_TITLE,
  DEMO_EXPLAIN_EXPLANATION_TECHNICAL_DETAILS_LABEL,
  DEMO_EXPLAIN_RISK_POSTURE_PREFIX,
} from "@/lib/demo-explain-page-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type Props = {
  readonly summary: RunExplanationSummary;
};

export function DemoExplainExplanationPanel(props: Props): React.JSX.Element {
  const summary = props.summary;
  const themes = summary.themeSummaries ?? [];
  const citations: ReadonlyArray<CitationReference> = summary.citations ?? [];
  const deterministicFallbackUsed = isDeterministicExplanationFallback(summary);
  const riskPosture = summary.riskPosture?.trim() ?? "";

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
          data-testid="demo-explain-explanation-heading"
        >
          {DEMO_EXPLAIN_EXPLANATION_PANEL_TITLE}
        </h2>
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {summary.findingCount} findings · {summary.decisionCount} decisions · {citations.length} citations
        </p>
      </header>

      <div className="rounded border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Overall assessment</h3>
        <p className={cn("mt-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {summary.overallAssessment || "(no overall assessment recorded)"}
        </p>

        {riskPosture.length > 0 ? (
          <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="demo-explain-risk-posture">
            {DEMO_EXPLAIN_RISK_POSTURE_PREFIX}: {riskPosture}
          </p>
        ) : null}
      </div>

      {themes.length > 0 ? (
        <div>
          <h3 className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Themes</h3>
          <ul className={cn("mt-1 list-disc pl-5 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {themes.map((theme) => (
              <li key={theme}>{theme}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div data-testid="demo-explain-citations">
        <h3 className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Citations ({citations.length})</h3>
        {citations.length === 0 ? (
          <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            No citations were emitted for this review — explanations on this page are unsupported.
          </p>
        ) : (
          <ul className={cn("mt-1 space-y-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {citations.map((citation) => (
              <li key={`${citation.kind}:${citation.id}`}>
                <span
                  className={cn(
                    "rounded bg-neutral-100 px-1 py-0.5 text-al-text-primary dark:bg-neutral-800",
                    OPERATOR_TYPOGRAPHY.badge,
                  )}
                >
                  {citationKindBuyerLabel(citation.kind)}
                </span>{" "}
                <span>{citation.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {(deterministicFallbackUsed ||
        (summary.faithfulnessSupportRatio !== null && summary.faithfulnessSupportRatio !== undefined)) ? (
        <details className="rounded border border-neutral-200 dark:border-neutral-800" data-testid="demo-explain-explanation-technical-details">
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-al-text-primary">
            {DEMO_EXPLAIN_EXPLANATION_TECHNICAL_DETAILS_LABEL}
          </summary>
          <div className={cn("space-y-2 border-t border-neutral-200 px-3 py-3 text-al-text-secondary dark:border-neutral-800", OPERATOR_TYPOGRAPHY.helper)}>
            {summary.faithfulnessSupportRatio !== null && summary.faithfulnessSupportRatio !== undefined ? (
              <p className="m-0">Citation support ratio: {summary.faithfulnessSupportRatio}</p>
            ) : null}
            {deterministicFallbackUsed ? <p className="m-0">{DEMO_EXPLAIN_DETERMINISTIC_FALLBACK_NOTE}</p> : null}
            {citations.length > 0 ? (
              <ul className="m-0 list-disc pl-5">
                {citations.map((citation) => (
                  <li key={`technical-${citation.kind}:${citation.id}`} className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>
                    {citationKindBuyerLabel(citation.kind)} · {citation.label} ({citation.id})
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </details>
      ) : null}
    </section>
  );
}
