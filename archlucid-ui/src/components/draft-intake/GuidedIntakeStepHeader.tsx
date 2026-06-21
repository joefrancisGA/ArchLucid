import type { ReactNode } from "react";

import { CardDescription, CardTitle } from "@/components/ui/card";

export type GuidedIntakeStepHeaderProps = {
  readonly stepLabel: string;
  readonly title: string;
  readonly description: ReactNode;
};

/** Step eyebrow and title inside guided intake cards — keeps Mode → Step → Form hierarchy. */
export function GuidedIntakeStepHeader(props: GuidedIntakeStepHeaderProps) {
  return (
    <div className="space-y-1" data-testid="socratic-intake-progress">
      <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {props.stepLabel}
      </p>
      <CardTitle className="text-lg">{props.title}</CardTitle>
      <CardDescription>{props.description}</CardDescription>
    </div>
  );
}
