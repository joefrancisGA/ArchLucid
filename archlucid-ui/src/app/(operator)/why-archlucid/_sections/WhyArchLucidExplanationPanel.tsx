import type { CitationReference, RunExplanationSummary } from "@/types/explanation";
import { WhyArchLucidExplanationStat } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidExplanationStat";

export type WhyArchLucidExplanationPanelProps = {
  readonly summary: RunExplanationSummary;
};

export function WhyArchLucidExplanationPanel(props: WhyArchLucidExplanationPanelProps) {
  const { summary } = props;
  const themes = summary.themeSummaries ?? [];
  const citations: ReadonlyArray<CitationReference> = summary.citations ?? [];

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <WhyArchLucidExplanationStat label="Findings" value={summary.findingCount} />
        <WhyArchLucidExplanationStat label="Decisions" value={summary.decisionCount} />
        <WhyArchLucidExplanationStat label="Unresolved" value={summary.unresolvedIssueCount} />
        <WhyArchLucidExplanationStat label="Compliance gaps" value={summary.complianceGapCount} />
      </dl>

      <div className="rounded border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
        <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Overall assessment</h3>
        <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
          {summary.overallAssessment || "(no overall assessment recorded)"}
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          Risk posture: <code>{summary.riskPosture || "unknown"}</code>
          {summary.deterministicFallbackUsed || summary.usedDeterministicFallback ? " · deterministic fallback in use" : ""}
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

      <div data-testid="why-archlucid-citations">
        <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Citations ({citations.length})</h3>
        {citations.length === 0 ? (
          <p className="mt-1 text-sm text-neutral-500">No citations were emitted for this review.</p>
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
    </div>
  );
}
