import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { OperatorEmptyState } from "@/components/operator/OperatorShellMessage";
import type { ComparisonExplanation } from "@/types/explanation";

const sectionBoxCls = "mt-5 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950";

/**
 * LLM-generated comparison narrative (when the explain endpoint succeeds).
 */
export function AiComparisonExplanationView(props: { explanation: ComparisonExplanation }) {
  const { explanation } = props;

  return (
    <section className="mt-7">
      <h3 className="mb-2">AI explanation</h3>
      <p className={cn("mt-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Generated from structured deltas. Treat as narrative assistance only—confirm every claim against the
        structured and legacy tables before sign-off.
      </p>

      <div className={sectionBoxCls}>
        <h4 className={cn("mt-0", OPERATOR_TYPOGRAPHY.helper)}>Summary</h4>
        <p className="m-0 font-semibold leading-normal">{explanation.highLevelSummary}</p>
      </div>

      <div className={sectionBoxCls}>
        <h4 className={cn("mt-0", OPERATOR_TYPOGRAPHY.helper)}>Major changes (from structured delta)</h4>
        {explanation.majorChanges.length === 0 ? (
          <OperatorEmptyState title="No major change lines">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>The model returned an empty list for this section.</p>
          </OperatorEmptyState>
        ) : (
          <ul className="m-0 pl-5 leading-relaxed">
            {explanation.majorChanges.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        )}
      </div>

      <div className={sectionBoxCls}>
        <h4 className={cn("mt-0", OPERATOR_TYPOGRAPHY.helper)}>Key tradeoffs</h4>
        {explanation.keyTradeoffs.length === 0 ? (
          <OperatorEmptyState title="No tradeoff lines">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>None reported for this comparison.</p>
          </OperatorEmptyState>
        ) : (
          <ul className="m-0 pl-5 leading-relaxed">
            {explanation.keyTradeoffs.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        )}
      </div>

      <div className={sectionBoxCls}>
        <h4 className={cn("mt-0", OPERATOR_TYPOGRAPHY.helper)}>Narrative</h4>
        <p className="m-0 whitespace-pre-wrap leading-relaxed">{explanation.narrative}</p>
      </div>
    </section>
  );
}
