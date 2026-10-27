import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { OperatorEmptyState } from "@/components/operator/OperatorShellMessage";
import type { ComparisonExplanation } from "@/types/explanation";
import {
  formatCompareAiExplanationCostDeltaHonesty,
  formatCompareAiExplanationSecurityDeltaHonesty,
} from "@/lib/compare/compare-ai-explanation-structured-honesty";
import {
  COMPARE_AI_EXPLANATION_MAJOR_CHANGES_NOT_STORED,
  COMPARE_AI_EXPLANATION_NARRATIVE_NOT_STORED,
  COMPARE_AI_EXPLANATION_SUMMARY_NOT_STORED,
  COMPARE_AI_EXPLANATION_TRADEOFFS_NOT_STORED,
  hasStoredAiComparisonExplanationText,
} from "@/lib/compare/compare-ai-explanation-view-honesty";

const sectionBoxCls = "mt-5 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950";

/**
 * LLM-generated comparison narrative (when the explain endpoint succeeds).
 */
export function AiComparisonExplanationView(props: {
  explanation: ComparisonExplanation;
  readonly structuredSecurityChangeCount?: number | null;
  readonly structuredCostChangeCount?: number | null;
}) {
  const { explanation } = props;

  return (
    <section className="mt-7">
      <h3 className="mb-2">AI explanation</h3>
      <p className={cn("mt-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Generated from structured deltas. Treat this as narrative assistance only. Confirm every claim against the
        structured comparison before you forward it.
      </p>
      <p
        className={cn("mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="compare-ai-explanation-security-delta-honesty"
      >
        {formatCompareAiExplanationSecurityDeltaHonesty(props.structuredSecurityChangeCount)}
      </p>
      <p
        className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="compare-ai-explanation-cost-delta-honesty"
      >
        {formatCompareAiExplanationCostDeltaHonesty(props.structuredCostChangeCount)}
      </p>

      <div className={sectionBoxCls}>
        <h4 className={cn("mt-0", OPERATOR_TYPOGRAPHY.helper)}>Summary</h4>
        {hasStoredAiComparisonExplanationText(explanation.highLevelSummary) ? (
          <p className="m-0 font-semibold leading-normal">{explanation.highLevelSummary.trim()}</p>
        ) : (
          <OperatorEmptyState title="No summary returned">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{COMPARE_AI_EXPLANATION_SUMMARY_NOT_STORED}</p>
          </OperatorEmptyState>
        )}
      </div>

      <div className={sectionBoxCls}>
        <h4 className={cn("mt-0", OPERATOR_TYPOGRAPHY.helper)}>Major changes (from structured delta)</h4>
        {explanation.majorChanges.length === 0 ? (
          <OperatorEmptyState title="No major change lines">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{COMPARE_AI_EXPLANATION_MAJOR_CHANGES_NOT_STORED}</p>
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
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{COMPARE_AI_EXPLANATION_TRADEOFFS_NOT_STORED}</p>
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
        {hasStoredAiComparisonExplanationText(explanation.narrative) ? (
          <p className="m-0 whitespace-pre-wrap leading-relaxed">{explanation.narrative.trim()}</p>
        ) : (
          <OperatorEmptyState title="No narrative returned">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{COMPARE_AI_EXPLANATION_NARRATIVE_NOT_STORED}</p>
          </OperatorEmptyState>
        )}
      </div>
    </section>
  );
}
