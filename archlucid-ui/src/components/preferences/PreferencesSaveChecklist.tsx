import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { EnterpriseStatusKind } from "@/lib/design-tokens-status";
import type { PreferencesSaveChecklistStep } from "@/lib/preferences-save-checklist";
import { cn } from "@/lib/utils";

export type PreferencesSaveChecklistProps = {
  readonly title: string;
  readonly description?: string;
  readonly steps: readonly PreferencesSaveChecklistStep[];
  readonly emphasizedStepId: string;
  readonly testIdPrefix: string;
};

function resolveStepStatusTag(
  step: PreferencesSaveChecklistStep,
  emphasizedStepId: string,
): { readonly kind: EnterpriseStatusKind; readonly label: string } {
  if (step.status === "default") {
    return { kind: "neutral", label: "Default" };
  }

  if (step.status === "done") {
    return { kind: "ready", label: "Done" };
  }

  return {
    kind: step.id === emphasizedStepId ? "in-progress" : "neutral",
    label: "Pending",
  };
}

/** Preferences setup checklist with Default / Done / Pending chips per section. */
export function PreferencesSaveChecklist(props: PreferencesSaveChecklistProps): React.JSX.Element {
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
        {props.steps.map((step) => {
          const statusTag = resolveStepStatusTag(step, props.emphasizedStepId);

          return (
            <li
              key={step.id}
              className="flex items-start justify-between gap-3"
              aria-current={step.id === props.emphasizedStepId ? "step" : undefined}
              data-emphasized={step.id === props.emphasizedStepId ? "true" : undefined}
              data-testid={`${props.testIdPrefix}-setup-step-${step.id}`}
            >
              <span
                className={cn(
                  step.status === "done" ? "text-al-text-primary" : "text-al-text-secondary",
                  step.id === props.emphasizedStepId ? "font-medium text-al-text-primary" : undefined,
                )}
              >
                {step.label}
              </span>
              <StatusTag kind={statusTag.kind} label={statusTag.label} />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
