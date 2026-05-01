import { cn } from "@/lib/utils";

export type GettingStartedStepsProps = {
  heading: string;
  steps: readonly string[];
  className?: string;
};

/**
 * Ordered “how it works” guidance for empty dashboards — keeps copy consistent across Alerts, Governance, etc.
 */
export function GettingStartedSteps({ heading, steps, className }: GettingStartedStepsProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-teal-200/90 bg-teal-50/50 px-4 py-3 text-left dark:border-teal-900/70 dark:bg-teal-950/35",
        className,
      )}
    >
      <p className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{heading}</p>
      <ol className="mb-0 mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-snug text-neutral-700 dark:text-neutral-300">
        {steps.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
    </div>
  );
}
