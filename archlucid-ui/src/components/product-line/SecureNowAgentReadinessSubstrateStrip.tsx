import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { SecureNowAgentReadinessSubstrate } from "@/lib/product-line/resolve-securenow-agent-readiness-substrate";
import { cn } from "@/lib/utils";

export type SecureNowAgentReadinessSubstrateStripProps = {
  readonly testId: string;
  readonly substrate: SecureNowAgentReadinessSubstrate;
};

export function SecureNowAgentReadinessSubstrateStrip(
  props: SecureNowAgentReadinessSubstrateStripProps,
): React.JSX.Element {
  return (
    <section
      className={cn(
        "rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid={props.testId}
      aria-label="SecureNow agent readiness substrate"
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusTag kind="neutral" label={props.substrate.modeLabel} data-testid={props.testId + "-mode"} />
      </div>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid={props.testId + "-explanation-lead"}>
        {props.substrate.explanationLead}
      </p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid={props.testId + "-rank-discipline"}>
        {props.substrate.rankDisciplineLine}
      </p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid={props.testId + "-citation"}>
        {props.substrate.citationLine}
      </p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)} data-testid={props.testId + "-not-autonomous"}>
        {props.substrate.notAutonomousLine}
      </p>
    </section>
  );
}
