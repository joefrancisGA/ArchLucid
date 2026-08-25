"use client";

import Link from "next/link";

import {
  AcceleratorCostGovernanceCloudPicker,
  useAcceleratorCostGovernancePackSelection,
} from "@/components/accelerator/AcceleratorCostGovernanceCloudPicker";
import { AcceleratorFollowUpPackTag } from "@/components/accelerator/AcceleratorFollowUpPackTag";
import { AcceleratorPackStartCta } from "@/components/accelerator/AcceleratorPackStartCta";
import {
  ACCELERATOR_JOB_CHOOSER_EXPECTED_OUTPUTS_LABEL,
  ACCELERATOR_JOB_CHOOSER_REQUIRED_INPUTS_LABEL,
} from "@/lib/accelerator-chooser-start-copy";
import {
  ACCELERATOR_COST_GOVERNANCE_GROUP,
  ACCELERATOR_COST_GOVERNANCE_GROUP_ID,
} from "@/lib/accelerator-chooser";
import { resolveAcceleratorCostGovernancePackEntry } from "@/lib/accelerator-chooser-grid";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { AcceleratorChooserPrerequisiteStatus } from "@/lib/resolve-accelerator-chooser-prerequisite-status";
import { cn } from "@/lib/utils";

export type AcceleratorCostGovernancePackRowProps = {
  readonly compact?: boolean;
  readonly rowTestIdPrefix?: string;
  readonly startTestIdPrefix?: string;
  readonly prerequisiteStatus: AcceleratorChooserPrerequisiteStatus;
  readonly onRetry?: () => void;
};

/** Grouped cost-governance accelerator row with Azure / AWS / GCP cloud picker. */
export function AcceleratorCostGovernancePackRow(props: AcceleratorCostGovernancePackRowProps): React.JSX.Element {
  const compact = props.compact ?? false;
  const rowPrefix = props.rowTestIdPrefix ?? "accelerator-chooser-row";
  const startPrefix = props.startTestIdPrefix ?? "accelerator-chooser-start";
  const { selectedPackId, setSelectedPackId } = useAcceleratorCostGovernancePackSelection();
  const selectedPack = resolveAcceleratorCostGovernancePackEntry(selectedPackId);

  return (
    <li
      className="min-w-0 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
      data-testid={`${rowPrefix}-${ACCELERATOR_COST_GOVERNANCE_GROUP_ID}`}
    >
      <h3 className={cn("m-0 text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {ACCELERATOR_COST_GOVERNANCE_GROUP.buyerJob}
      </h3>
      <p className={cn("m-0 mt-1 font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
        {ACCELERATOR_COST_GOVERNANCE_GROUP.packLabel}
      </p>
      <AcceleratorFollowUpPackTag testId={`${rowPrefix}-${ACCELERATOR_COST_GOVERNANCE_GROUP_ID}-follow-up-tag`} />
      <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        {ACCELERATOR_COST_GOVERNANCE_GROUP.summary}
      </p>
      <AcceleratorCostGovernanceCloudPicker
        selectedPackId={selectedPackId}
        onSelectedPackIdChange={setSelectedPackId}
      />
      {compact ? null : (
        <p className={cn("m-0 mt-2 text-neutral-500 dark:text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-neutral-600 dark:text-neutral-400">
            {ACCELERATOR_JOB_CHOOSER_REQUIRED_INPUTS_LABEL}:{" "}
          </span>
          {ACCELERATOR_COST_GOVERNANCE_GROUP.requiredInputs}
        </p>
      )}
      {compact ? null : (
        <p className={cn("m-0 mt-2 text-neutral-500 dark:text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-neutral-600 dark:text-neutral-400">
            {ACCELERATOR_JOB_CHOOSER_EXPECTED_OUTPUTS_LABEL}:{" "}
          </span>
          {ACCELERATOR_COST_GOVERNANCE_GROUP.expectedOutputs}
        </p>
      )}
      <AcceleratorPackStartCta
        packId={selectedPackId}
        packLabel={selectedPack.packLabel}
        buyerJob={selectedPack.buyerJob}
        startHref={selectedPack.startHref}
        prerequisiteStatus={props.prerequisiteStatus}
        startTestId={`${startPrefix}-${selectedPackId}`}
        blockedMessageTestId={`${rowPrefix}-${ACCELERATOR_COST_GOVERNANCE_GROUP_ID}-blocked`}
        onRetry={props.onRetry}
      />
    </li>
  );
}
