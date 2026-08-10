"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import {
  AcceleratorCostGovernanceCloudPicker,
  useAcceleratorCostGovernancePackSelection,
} from "@/components/accelerator/AcceleratorCostGovernanceCloudPicker";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { Button } from "@/components/ui/button";
import {
  ACCELERATOR_COST_GOVERNANCE_GROUP,
  ACCELERATOR_COST_GOVERNANCE_GROUP_ID,
} from "@/lib/accelerator-chooser";
import { ACCELERATOR_COST_GOVERNANCE_HELP_PACK_TEST_ID, resolveAcceleratorCostGovernancePackEntry } from "@/lib/accelerator-chooser-grid";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Grouped cost-governance pack card for `/help/accelerator-chooser`. */
export function HelpAcceleratorCostGovernancePackCard(): React.JSX.Element {
  const { selectedPackId, setSelectedPackId } = useAcceleratorCostGovernancePackSelection();
  const selectedPack = resolveAcceleratorCostGovernancePackEntry(selectedPackId);

  return (
    <li
      className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid={ACCELERATOR_COST_GOVERNANCE_HELP_PACK_TEST_ID}
    >
      <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {ACCELERATOR_COST_GOVERNANCE_GROUP.buyerJob}
      </h3>
      <p className={cn("m-0 mt-1 font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {ACCELERATOR_COST_GOVERNANCE_GROUP.packLabel}
      </p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        {ACCELERATOR_COST_GOVERNANCE_GROUP.summary}
      </p>
      <AcceleratorCostGovernanceCloudPicker
        selectedPackId={selectedPackId}
        onSelectedPackIdChange={setSelectedPackId}
        pickerTestId="help-accelerator-cost-governance-cloud-picker"
        optionTestIdPrefix="help-accelerator-cost-governance-cloud"
      />
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        <span className="font-medium text-al-text-primary">When not to use: </span>
        {selectedPack.doNotUseWhen}
      </p>
      <CollapsibleSection
        title="Technical inputs and outputs"
        summaryAriaLabel={`Technical inputs and outputs for ${ACCELERATOR_COST_GOVERNANCE_GROUP.buyerJob}`}
        sectionTestId={`help-accelerator-chooser-pack-${ACCELERATOR_COST_GOVERNANCE_GROUP_ID}-technical`}
      >
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-al-text-primary">Inputs: </span>
          {ACCELERATOR_COST_GOVERNANCE_GROUP.requiredInputs}
        </p>
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-al-text-primary">Outputs: </span>
          {ACCELERATOR_COST_GOVERNANCE_GROUP.expectedOutputs}
        </p>
      </CollapsibleSection>
      <Button asChild size="sm" variant="primary" className="mt-3">
        <Link href={selectedPack.startHref} data-testid={`help-accelerator-chooser-start-${selectedPackId}`}>
          Start with this pack
        </Link>
      </Button>
    </li>
  );
}
