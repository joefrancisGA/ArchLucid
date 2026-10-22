import { OperatorErrorRecoveryContract } from "@/components/usability/OperatorErrorRecoveryContract";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { IntegrationZoneRecovery } from "@/lib/integration-zone-recovery";
import { cn } from "@/lib/utils";

export type IntegrationZoneRecoveryCardProps = {
  readonly recovery: IntegrationZoneRecovery;
  readonly testId?: string;
  readonly className?: string;
};

/** Per-zone partial-load recovery for multi-zone integration hubs (TB-2388). */
export function IntegrationZoneRecoveryCard(props: IntegrationZoneRecoveryCardProps): React.JSX.Element {
  const testId = props.testId ?? `integration-zone-recovery-${props.recovery.zoneId}`;

  return (
    <section
      aria-labelledby={`${testId}-heading`}
      className={cn(
        "rounded-md border border-amber-200 bg-amber-50/60 px-3 py-3 dark:border-amber-900/50 dark:bg-amber-950/20",
        props.className,
      )}
      data-testid={testId}
    >
      <h3
        id={`${testId}-heading`}
        className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.helper)}
      >
        {props.recovery.zoneLabel}
      </h3>
      <OperatorErrorRecoveryContract
        presentation={props.recovery.presentation}
        testId={`${testId}-contract`}
        className="mt-2 border-0 bg-transparent px-0 py-0 dark:bg-transparent"
      />
    </section>
  );
}
