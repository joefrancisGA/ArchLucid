import { cn } from "@/lib/utils";
import type { CitationReference, RunExplanationSummary } from "@/types/explanation";
import { isDeterministicExplanationFallback } from "@/types/explanation";
import { WhyArchLucidExplanationStat } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidExplanationStat";
import { citationKindBuyerLabel } from "@/lib/citation-kind-buyer-label";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type WhyArchLucidExplanationPanelProps = {
  readonly summary: RunExplanationSummary;
};

export function WhyArchLucidExplanationPanel(props: WhyArchLucidExplanationPanelProps) {
  const { summary } = props;
  const themes = summary.themeSummaries ?? [];
  const citations: ReadonlyArray<CitationReference> = summary.citations ?? [];

  return (
    <div className="space-y-4">
      <dl className={cn("grid grid-cols-2 gap-2 sm:grid-cols-4", OPERATOR_TYPOGRAPHY.body)}>
        <WhyArchLucidExplanationStat label="Findings" value={summary.findingCount} />
        <WhyArchLucidExplanationStat label="Decisions" value={summary.decisionCount} />
        <WhyArchLucidExplanationStat label="Unresolved" value={summary.unresolvedIssueCount} />
        <WhyArchLucidExplanationStat label="Compliance gaps" value={summary.complianceGapCount} />
      </dl>

      <div className="rounded border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
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

      <div data-testid="why-archlucid-citations">
        <h3 className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Citations ({citations.length})</h3>
        {citations.length === 0 ? (
          <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No citations were emitted for this review.</p>
        ) : (
          <ul className={cn("mt-1 space-y-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {citations.map((c) => (
              <li key={`${c.kind}:${c.id}`} className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>
                <span className="rounded bg-neutral-100 px-1 py-0.5 text-al-text-primary dark:bg-neutral-800">
                  {citationKindBuyerLabel(c.kind)}
                </span>{" "}
                <span>{c.label}</span> <span className="text-al-text-secondary">({c.id})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
