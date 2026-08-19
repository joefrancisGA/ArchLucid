import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type PilotPathPreviewStep = {
  readonly id: string;
  readonly label: string;
};

export type PilotPathPreviewStepperProps = {
  readonly steps: readonly PilotPathPreviewStep[];
  readonly className?: string;
};

/** Compact horizontal preview of the first-review path — sets time-to-value expectations before the primary CTA. */
export function PilotPathPreviewStepper(props: PilotPathPreviewStepperProps): React.JSX.Element {
  return (
    <ol
      className={cn("m-0 flex flex-wrap items-center gap-x-1.5 gap-y-1 list-none p-0", props.className)}
      aria-label="First review path"
      data-testid="pilot-path-preview-stepper"
    >
      {props.steps.map((step, index) => (
        <li key={step.id} className="inline-flex items-center gap-1">
          <span
            className={cn(
              OPERATOR_TYPOGRAPHY.badge,
              (cn("inline-flex h-4 min-w-[1rem] items-center justify-center rounded border border-neutral-300 bg-white px-0.5 font-semibold text-neutral-700 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.badge)),
            )}
            aria-hidden
          >
            {index + 1}
          </span>
          <span className={cn(OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}>{step.label}</span>
          {index < props.steps.length - 1 ? (
            <span className={cn(OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary/60")} aria-hidden>
              →
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
