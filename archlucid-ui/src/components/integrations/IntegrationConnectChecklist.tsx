import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type IntegrationConnectChecklistStep = {
  readonly id: string;
  readonly label: string;
  readonly complete: boolean;
};

export type IntegrationConnectChecklistProps = {
  readonly title: string;
  readonly description?: string;
  readonly steps: readonly IntegrationConnectChecklistStep[];
  readonly emphasizedStepId: string;
  readonly testIdPrefix: string;
};

/** Reusable three-step integration setup checklist for connector pages. */
export function IntegrationConnectChecklist(props: IntegrationConnectChecklistProps): React.JSX.Element {
  return (
    <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
      <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{props.title}</h2>
      {props.description !== undefined ? (
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.description}</p>
      ) : null}
      <ol
        className={cn("m-0 mt-3 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}
        aria-label={`${props.title} progress`}
        data-testid={`${props.testIdPrefix}-setup-progress`}
      >
        {props.steps.map((step) => (
          <li
            key={step.id}
            className="flex items-start justify-between gap-3"
            aria-current={step.id === props.emphasizedStepId ? "step" : undefined}
            data-emphasized={step.id === props.emphasizedStepId ? "true" : undefined}
            data-testid={`${props.testIdPrefix}-setup-step-${step.id}`}
          >
            <span
              className={cn(
                step.complete ? "text-al-text-primary" : "text-al-text-secondary",
                step.id === props.emphasizedStepId ? "font-medium text-al-text-primary" : undefined,
              )}
            >
              {step.label}
            </span>
            <StatusTag
              kind={step.complete ? "ready" : step.id === props.emphasizedStepId ? "in-progress" : "neutral"}
              label={step.complete ? "Done" : "Pending"}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
