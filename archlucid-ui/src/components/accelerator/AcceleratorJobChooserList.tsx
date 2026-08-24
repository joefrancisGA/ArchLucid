"use client";

import { cn } from "@/lib/utils";

import { AcceleratorCostGovernancePackRow } from "@/components/accelerator/AcceleratorCostGovernancePackRow";
import { AcceleratorPackStartCta } from "@/components/accelerator/AcceleratorPackStartCta";
import { useAcceleratorChooserPrerequisitePresentation } from "@/hooks/use-accelerator-chooser-prerequisite-presentation";
import {
  ACCELERATOR_JOB_CHOOSER_EXPECTED_OUTPUTS_LABEL,
  ACCELERATOR_JOB_CHOOSER_REQUIRED_INPUTS_LABEL,
} from "@/lib/accelerator-chooser-start-copy";
import type { AcceleratorChooserEntry } from "@/lib/accelerator-chooser";
import { buildAcceleratorChooserGridItemsForPrerequisite } from "@/lib/accelerator-chooser-grid";
import { ACCELERATOR_GREENFIELD_PACK_ID } from "@/lib/accelerator-chooser-pack-prerequisite";
import type { AcceleratorChooserPrerequisiteStatus } from "@/lib/resolve-accelerator-chooser-prerequisite-status";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type AcceleratorJobChooserListProps = {
  readonly listTestId?: string;
  readonly rowTestIdPrefix?: string;
  readonly startTestIdPrefix?: string;
  readonly className?: string;
  /** Omits the technical required-inputs and expected-outputs lines where the list is a secondary offer. */
  readonly compact?: boolean;
};

type AcceleratorChooserPackRowProps = {
  readonly entry: AcceleratorChooserEntry;
  readonly compact: boolean;
  readonly rowPrefix: string;
  readonly startPrefix: string;
  readonly prerequisiteStatus: AcceleratorChooserPrerequisiteStatus;
};

function AcceleratorChooserPackRow(props: AcceleratorChooserPackRowProps): React.JSX.Element {
  const { entry, compact, rowPrefix, startPrefix, prerequisiteStatus } = props;
  const primaryWhenReady =
    entry.id === ACCELERATOR_GREENFIELD_PACK_ID && prerequisiteStatus === "not-met";

  return (
    <li
      className="min-w-0 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
      data-testid={`${rowPrefix}-${entry.id}`}
    >
      <h3 className={cn("m-0 text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {entry.buyerJob}
      </h3>
      <p className={cn("m-0 mt-1 font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
        {entry.packLabel}
      </p>
      <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        {entry.summary}
      </p>
      {compact ? null : (
        <p className={cn("m-0 mt-2 text-neutral-500 dark:text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-neutral-600 dark:text-neutral-400">
            {ACCELERATOR_JOB_CHOOSER_REQUIRED_INPUTS_LABEL}:{" "}
          </span>
          {entry.requiredInputs}
        </p>
      )}
      {compact ? null : (
        <p className={cn("m-0 mt-2 text-neutral-500 dark:text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-neutral-600 dark:text-neutral-400">
            {ACCELERATOR_JOB_CHOOSER_EXPECTED_OUTPUTS_LABEL}:{" "}
          </span>
          {entry.expectedOutputs}
        </p>
      )}
      <AcceleratorPackStartCta
        packId={entry.id}
        packLabel={entry.packLabel}
        buyerJob={entry.buyerJob}
        startHref={entry.startHref}
        prerequisiteStatus={prerequisiteStatus}
        startTestId={`${startPrefix}-${entry.id}`}
        blockedMessageTestId={`${rowPrefix}-${entry.id}-blocked`}
        primaryWhenReady={primaryWhenReady}
      />
    </li>
  );
}

/** Buyer-job rows with pack label and expected outputs — shared by home and first-run review start (TB-2136). */
export function AcceleratorJobChooserList(props: AcceleratorJobChooserListProps): React.JSX.Element {
  const presentation = useAcceleratorChooserPrerequisitePresentation();
  const rowPrefix = props.rowTestIdPrefix ?? "accelerator-chooser-row";
  const startPrefix = props.startTestIdPrefix ?? "accelerator-chooser-start";
  const compact = props.compact ?? false;
  const gridItems = buildAcceleratorChooserGridItemsForPrerequisite(presentation.status);

  return (
    <ul
      className={cn("m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2", props.className)}
      data-testid={props.listTestId}
    >
      {gridItems.map((item) => {
        if (item.kind === "cost-governance-group") {
          return (
            <AcceleratorCostGovernancePackRow
              key="cost-governance-group"
              compact={compact}
              rowTestIdPrefix={rowPrefix}
              startTestIdPrefix={startPrefix}
              prerequisiteStatus={presentation.status}
            />
          );
        }

        return (
          <AcceleratorChooserPackRow
            key={item.entry.id}
            entry={item.entry}
            compact={compact}
            rowPrefix={rowPrefix}
            startPrefix={startPrefix}
            prerequisiteStatus={presentation.status}
          />
        );
      })}
    </ul>
  );
}
