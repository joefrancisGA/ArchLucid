import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CopyIdButton } from "@/components/CopyIdButton";

export type ReviewCliReproduceSectionProps = {
  readonly runId: string;
  readonly ruleSetId?: string | null;
};

/** CLI command that reproduces this review — bridging UI validation to CI pipeline automation. */
export function ReviewCliReproduceSection({
  runId,
  ruleSetId,
}: ReviewCliReproduceSectionProps): ReactElement {
  const policyFlag = ruleSetId ? ` --policy ${ruleSetId}` : "";
  const command = `archlucid review run --package-id ${runId}${policyFlag}`;

  return (
    <section id="cli-reproduce" className="scroll-mt-24">
      <CollapsibleSection title="Reproduce via CLI" defaultOpen={false}>
        <p className={cn("m-0 mb-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          Run this command in your CI pipeline to reproduce this analysis with the same scope and policy pack.
          Requires the ArchLucid CLI authenticated to this workspace.
        </p>
        <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
          <code className={cn("min-w-0 flex-1 break-all font-mono text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
            {command}
          </code>
          <CopyIdButton value={command} aria-label="Copy CLI command" />
        </div>
      </CollapsibleSection>
    </section>
  );
}
