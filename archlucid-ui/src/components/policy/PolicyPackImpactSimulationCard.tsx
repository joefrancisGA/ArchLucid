import { cn } from "@/lib/utils";
import { GovernanceDryRunModal } from "@/components/governance/GovernanceDryRunModal";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
export type PolicyPackImpactSimulationCardProps = {
  readonly selectedPackId: string;
  readonly selectedPackLabel?: string | null;
};

/**
 * Prominent entry to the governance dry-run modal — simulates pack threshold changes against historic reviews.
 */
export function PolicyPackImpactSimulationCard(props: PolicyPackImpactSimulationCardProps): React.JSX.Element | null {
  const selectedPackId = props.selectedPackId.trim();

  if (selectedPackId.length === 0) {
    return null;
  }

  const label =
    props.selectedPackLabel !== null &&
    props.selectedPackLabel !== undefined &&
    props.selectedPackLabel.trim().length > 0
      ? props.selectedPackLabel.trim()
      : selectedPackId;

  return (
    <section
      data-testid="policy-pack-impact-simulation"
      className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
      aria-labelledby="policy-pack-impact-simulation-heading"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl space-y-1">
          <h2
            id="policy-pack-impact-simulation-heading"
            className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}
          >
            Simulate policy impact
          </h2>
          <p className={cn("m-0 leading-relaxed text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            Compare how proposed threshold changes on{" "}
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">{label}</span> would affect historic
            reviews before you publish or assign a new version.
          </p>
        </div>
        <GovernanceDryRunModal policyPackId={selectedPackId} />
      </div>
    </section>
  );
}
