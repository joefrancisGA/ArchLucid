import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { SecureNowCuttingEdgeSubstrate } from "@/lib/product-line/resolve-securenow-cutting-edge-substrate";
import { cn } from "@/lib/utils";

export type SecureNowCuttingEdgeSubstrateStripProps = {
  readonly testId: string;
  readonly substrate: SecureNowCuttingEdgeSubstrate;
};

export function SecureNowCuttingEdgeSubstrateStrip(
  props: SecureNowCuttingEdgeSubstrateStripProps,
): React.JSX.Element {
  const td = props.testId;
  return (
    <section
      className={cn(
        "rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid={td}
      aria-label="SecureNow cutting-edge AI substrate"
    >
      <StatusTag kind="neutral" label={props.substrate.substrateLabel} data-testid={td + "-label"} />
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid={td + "-rank"}>
        {props.substrate.rankDisciplineLine}
      </p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid={td + "-stored"}>
        {props.substrate.storedPathLine}
      </p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid={td + "-explanation"}>
        {props.substrate.explanationSubstrateLine}
      </p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid={td + "-ask"}>
        {props.substrate.askBoundedLine}
      </p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)} data-testid={td + "-not-frontier"}>
        {props.substrate.notFrontierLine}
      </p>
    </section>
  );
}
