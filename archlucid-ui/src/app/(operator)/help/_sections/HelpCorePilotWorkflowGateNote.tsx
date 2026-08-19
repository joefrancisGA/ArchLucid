import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { CorePilotHelpWorkflowStepCta } from "@/lib/resolve-core-pilot-help-workflow-step-cta";
import { cn } from "@/lib/utils";

export type HelpCorePilotWorkflowGateNoteProps = {
  readonly cta: CorePilotHelpWorkflowStepCta;
  readonly gatedStepNumbers: readonly number[];
};

function gatedStepsSentence(stepNumbers: readonly number[]): string {
  const last = stepNumbers.at(-1);

  if (last === undefined) {
    return "";
  }

  if (stepNumbers.length === 1) {
    return `Step ${last}`;
  }

  return `Steps ${stepNumbers.slice(0, -1).join(", ")} and ${last}`;
}

/**
 * One gate for every step that resolves to the same "no review yet" CTA.
 * Replaces the previous per-step repeat of an identical control and helper line.
 */
export function HelpCorePilotWorkflowGateNote(
  props: HelpCorePilotWorkflowGateNoteProps,
): React.ReactElement {
  const { cta, gatedStepNumbers } = props;

  return (
    <div
      className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-neutral-200 bg-neutral-50/80 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="core-pilot-workflow-gate-note"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
        <span className="font-medium text-al-text-primary">
          {gatedStepsSentence(gatedStepNumbers)} unlock after your first review starts.
        </span>{" "}
        {cta.helperText}
      </p>
      {cta.href !== null ? (
        <Button asChild size="sm" variant="outline" data-testid="core-pilot-workflow-gate-cta">
          <Link href={cta.href}>{cta.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}
