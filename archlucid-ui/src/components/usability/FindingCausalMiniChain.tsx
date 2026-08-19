import { cn } from "@/lib/utils";

import {
  FINDING_CAUSAL_STEP_MISSING,
  type FindingCausalMiniChainResult,
} from "@/lib/findings/finding-causal-mini-chain";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type FindingCausalMiniChainProps = {
  readonly chain: FindingCausalMiniChainResult;
  readonly className?: string;
  readonly defaultOpen?: boolean;
};

/** Expandable rule → evidence → recommendation disclosure beside finding derivation (TB-2217). */
export function FindingCausalMiniChain(props: FindingCausalMiniChainProps): React.JSX.Element {
  const { chain, className, defaultOpen = false } = props;

  return (
    <details
      className={cn(
        "rounded-md border border-neutral-200 bg-neutral-50/80 p-2 dark:border-neutral-700 dark:bg-neutral-900/40",
        className,
      )}
      data-testid="finding-causal-mini-chain"
      open={defaultOpen ? true : undefined}
    >
      <summary className={cn("cursor-pointer select-none font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Causal chain
      </summary>
      <ol className={cn("m-0 mt-2 list-none space-y-1.5 p-0", OPERATOR_TYPOGRAPHY.body)}>
        {chain.steps.map((step, index) => (
          <li
            key={step.key}
            className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5"
            data-testid={`finding-causal-mini-chain-step-${step.key}`}
          >
            <span className="font-semibold text-al-text-primary">
              {index + 1}. {step.label}
            </span>
            <span
              className={cn(
                step.value !== null ? "text-al-text-secondary" : "italic text-neutral-500 dark:text-neutral-400",
              )}
              data-testid={`finding-causal-mini-chain-value-${step.key}`}
            >
              {step.value ?? FINDING_CAUSAL_STEP_MISSING}
            </span>
          </li>
        ))}
      </ol>
    </details>
  );
}