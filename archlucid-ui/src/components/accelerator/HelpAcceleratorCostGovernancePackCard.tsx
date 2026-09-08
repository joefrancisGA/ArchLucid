"use client";

import Link from "next/link";

import {
  AcceleratorCostGovernanceCloudPicker,
  useAcceleratorCostGovernancePackSelection,
} from "@/components/accelerator/AcceleratorCostGovernanceCloudPicker";
import { AcceleratorCostBaselineRecommendation } from "@/components/accelerator/AcceleratorCostBaselineRecommendation";
import { AcceleratorPackStartCta } from "@/components/accelerator/AcceleratorPackStartCta";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import {
  ACCELERATOR_COST_GOVERNANCE_GROUP,
  ACCELERATOR_COST_GOVERNANCE_GROUP_ID,
} from "@/lib/accelerator-chooser";
import {
  ACCELERATOR_COST_GOVERNANCE_HELP_PACK_TEST_ID,
  resolveAcceleratorCostGovernancePackEntry,
} from "@/lib/accelerator-chooser-grid";
import { resolvePackCtaState } from "@/lib/accelerator-chooser-pack-prerequisite";
import {
  ACCELERATOR_COST_GOVERNANCE_CLOUD_SELECTION_REQUIRED_MESSAGE,
  ACCELERATOR_JOB_CHOOSER_REQUIRED_INPUTS_LABEL,
} from "@/lib/accelerator-chooser-start-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { AcceleratorChooserPrerequisiteStatus } from "@/lib/resolve-accelerator-chooser-prerequisite-status";
import { cn } from "@/lib/utils";

type HelpAcceleratorCostGovernancePackCardProps = {
  readonly prerequisiteStatus: AcceleratorChooserPrerequisiteStatus;
  readonly onRetry?: () => void;
};

/** Grouped cost-policy pack card for `/help/accelerator-chooser`. */
export function HelpAcceleratorCostGovernancePackCard(
  props: HelpAcceleratorCostGovernancePackCardProps,
): React.JSX.Element {
  const { prerequisiteStatus, onRetry } = props;
  const { selectedPackId, setSelectedPackId } = useAcceleratorCostGovernancePackSelection();
  const selectedPack = selectedPackId === null ? null : resolveAcceleratorCostGovernancePackEntry(selectedPackId);
  const ctaState = resolvePackCtaState(prerequisiteStatus, selectedPackId ?? ACCELERATOR_COST_GOVERNANCE_GROUP_ID);
  const cloudSelectionRequiredId = `help-accelerator-chooser-pack-${ACCELERATOR_COST_GOVERNANCE_GROUP_ID}-cloud-required`;

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
      <AcceleratorCostBaselineRecommendation
        testId={`help-accelerator-chooser-pack-${ACCELERATOR_COST_GOVERNANCE_GROUP_ID}-baseline-recommendation`}
      />
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        <span className="font-medium text-al-text-primary">{ACCELERATOR_JOB_CHOOSER_REQUIRED_INPUTS_LABEL}: </span>
        <Link href={inAppHelpHref("evidence-intake")} className={OPERATOR_LINK.inline}>
          {ACCELERATOR_COST_GOVERNANCE_GROUP.requiredInputs}
        </Link>
      </p>
      <AcceleratorCostGovernanceCloudPicker
        selectedPackId={selectedPackId}
        onSelectedPackIdChange={setSelectedPackId}
        pickerTestId="help-accelerator-cost-governance-cloud-picker"
        optionTestIdPrefix="help-accelerator-cost-governance-cloud"
      />
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        <span className="font-medium text-al-text-primary">When not to use: </span>
        {selectedPack?.doNotUseWhen ?? "Choose a cloud above to see provider-specific guidance."}
      </p>
      <CollapsibleSection
        title="Technical outputs and file detail"
        summaryAriaLabel={`Technical outputs and file detail for ${ACCELERATOR_COST_GOVERNANCE_GROUP.buyerJob}`}
        sectionTestId={`help-accelerator-chooser-pack-${ACCELERATOR_COST_GOVERNANCE_GROUP_ID}-technical`}
      >
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-al-text-primary">Inputs: </span>
          {ACCELERATOR_COST_GOVERNANCE_GROUP.technicalInputs}
        </p>
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-al-text-primary">Outputs: </span>
          {ACCELERATOR_COST_GOVERNANCE_GROUP.expectedOutputs}
        </p>
      </CollapsibleSection>
      {selectedPackId === null ? (
        <p
          id={cloudSelectionRequiredId}
          className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        >
          {ACCELERATOR_COST_GOVERNANCE_CLOUD_SELECTION_REQUIRED_MESSAGE}
        </p>
      ) : null}
      <AcceleratorPackStartCta
        packId={selectedPackId ?? ACCELERATOR_COST_GOVERNANCE_GROUP_ID}
        packLabel={selectedPack?.packLabel ?? ACCELERATOR_COST_GOVERNANCE_GROUP.packLabel}
        buyerJob={selectedPack?.buyerJob ?? ACCELERATOR_COST_GOVERNANCE_GROUP.buyerJob}
        startHref={selectedPack?.startHref ?? "#"}
        prerequisiteStatus={prerequisiteStatus}
        startTestId={
          ctaState === "ready" && selectedPackId !== null
            ? `help-accelerator-chooser-start-${selectedPackId}`
            : selectedPackId === null
              ? `help-accelerator-chooser-start-${ACCELERATOR_COST_GOVERNANCE_GROUP_ID}`
              : undefined
        }
        blockedMessageTestId={
          ctaState !== "ready" ? `help-accelerator-chooser-pack-${ACCELERATOR_COST_GOVERNANCE_GROUP_ID}-blocked` : undefined
        }
        onRetry={onRetry}
        disabled={selectedPackId === null}
        disabledReasonId={selectedPackId === null ? cloudSelectionRequiredId : undefined}
      />
    </li>
  );
}
