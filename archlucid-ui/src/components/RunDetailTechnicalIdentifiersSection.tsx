import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
import { CopyIdButton } from "@/components/CopyIdButton";
import { formatOperatorProjectIdDisplay } from "@/lib/operator-project-display";

export type RunDetailTechnicalIdentifiersSectionProps = {
  readonly runId: string;
  readonly projectId: string;
  readonly createdLabel: string;
  readonly buyerPolishedShell: boolean;
};

/**
 * Collapsed-by-default review / project identifiers for audit and integrations.
 * Lives at the bottom of run detail so the primary narrative stays business-first.
 */
export function RunDetailTechnicalIdentifiersSection({
  runId,
  projectId,
  createdLabel,
  buyerPolishedShell,
}: RunDetailTechnicalIdentifiersSectionProps) {
  const triggerLabel = buyerPolishedShell ? "Technical details" : "Developer & API identifiers";
  const projectDisplay = buyerPolishedShell ? formatOperatorProjectIdDisplay(projectId) : projectId;

  return (
    <section id="technical-identifiers" className="scroll-mt-24" aria-label={triggerLabel}>
      <AdvancedOptionsAccordion triggerLabel={triggerLabel}>
        <dl className="m-0 grid gap-2 text-sm text-neutral-600 dark:text-neutral-400 sm:grid-cols-[auto_1fr] sm:gap-x-6 sm:gap-y-1">
          <dt className="font-medium text-neutral-700 dark:text-neutral-300">Review ID</dt>
          <dd className="m-0 flex min-w-0 flex-wrap items-center gap-1">
            <code className="truncate rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100">
              {runId}
            </code>
            <CopyIdButton value={runId} aria-label="Copy review ID" />
          </dd>
          <dt className="font-medium text-neutral-700 dark:text-neutral-300">Project</dt>
          <dd
            className={
              buyerPolishedShell
                ? "m-0 text-xs text-neutral-800 dark:text-neutral-200"
                : "m-0 font-mono text-xs text-neutral-800 dark:text-neutral-200"
            }
          >
            {projectDisplay}
          </dd>
          <dt className="font-medium text-neutral-700 dark:text-neutral-300">Created</dt>
          <dd className="m-0">{createdLabel}</dd>
        </dl>
      </AdvancedOptionsAccordion>
    </section>
  );
}
